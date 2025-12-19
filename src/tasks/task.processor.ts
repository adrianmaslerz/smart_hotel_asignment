import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { Types } from 'mongoose';
import { QueueName } from '../queue/queue-name.enum';
import { QUEUE_CONFIGS } from '../queue/queue.config';
import { TaskJobData } from './task-job.interface';
import { TasksRepository } from './tasks.repository';
import { TaskLogRepository } from './task-log.repository';
import { UploadService } from '../upload/upload.service';
import { ReservationsService } from '../reservations/reservations.service';
import { TaskStatus } from './task-status.enum';
import { TaskLogType } from './task-log-type.enum';

@Processor(QueueName.TASKS)
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogRepository: TaskLogRepository,
    private readonly uploadService: UploadService,
    private readonly reservationsService: ReservationsService,
  ) {}

  private async processReservationsWithLogging(
    fileStream: Readable,
    taskId: Types.ObjectId,
  ): Promise<void> {
    const onFailure = async (rowIndex: number, errorMessage: string) => {
      await this.taskLogRepository.create({
        taskId,
        message: `Row ${rowIndex}: ${errorMessage}`,
        type: TaskLogType.ENTRY,
      });
    };

    try {
      await this.reservationsService.processReservations(fileStream, onFailure);
    } catch (error) {
      const errorMessage = `Error processing reservations: ${error instanceof Error ? error.message : String(error)}`;
      await this.taskLogRepository.create({
        taskId,
        message: errorMessage,
        type: TaskLogType.GENERAL,
      });
      throw error;
    }
  }

  @Process()
  async processTask(job: Job<TaskJobData>): Promise<void> {
    const { taskId } = job.data;
    this.logger.debug(`Processing task job ${job.id} with taskId: ${taskId}`);

    try {
      await job.progress(10);

      const task = await this.tasksRepository.getById(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== TaskStatus.PENDING) {
        const errorMessage = `Task ${taskId} is not in PENDING status`;
        await this.taskLogRepository.create({
          taskId: task._id,
          message: errorMessage,
          type: TaskLogType.GENERAL,
        });
        throw new Error(errorMessage);
      }

      await this.tasksRepository.updateStatus(taskId, TaskStatus.IN_PROGRESS);

      await job.progress(30);

      const fileStream = await this.uploadService.getFileStream(task.filePath);

      await job.progress(50);

      await this.processReservationsWithLogging(fileStream, task._id);

      await job.progress(100);

      await this.tasksRepository.updateStatus(taskId, TaskStatus.COMPLETED);

      this.logger.log(`Task ${taskId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process task job ${job.id}:`, error);

      const config = QUEUE_CONFIGS[QueueName.TASKS];
      const maxAttempts = config.defaultJobOptions.attempts ?? 1;

      if (job.attemptsMade >= maxAttempts) {
        await this.tasksRepository.updateStatus(taskId, TaskStatus.FAILED);
        this.logger.warn(
          `Task ${taskId} marked as FAILED after ${maxAttempts} attempts`,
        );
      }

      throw error;
    }
  }
}
