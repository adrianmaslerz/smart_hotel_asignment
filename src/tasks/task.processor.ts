import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, BadRequestException } from '@nestjs/common';
import { QueueName } from '../queue/queue-name.enum';
import { QUEUE_CONFIGS } from '../queue/queue.config';
import { TaskJobData } from './task-job.interface';
import { TasksRepository } from './tasks.repository';
import { UploadService } from '../upload/upload.service';
import { ReservationsService } from '../reservations/reservations.service';
import { TaskStatus } from './task-status.enum';

@Processor(QueueName.TASKS)
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly uploadService: UploadService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Process()
  async processTask(job: Job<TaskJobData>): Promise<void> {
    const { taskId } = job.data;
    this.logger.debug(`Processing task job ${job.id} with taskId: ${taskId}`);

    try {
      await job.progress(10);

      const task = await this.tasksRepository.getById(taskId);
      if (!task) {
        throw new BadRequestException(`Task ${taskId} not found`);
      }

      if (task.status !== TaskStatus.PENDING) {
        throw new BadRequestException(
          `Task ${taskId} is not in PENDING status`,
        );
      }

      await job.progress(30);

      const fileStream = await this.uploadService.getFileStream(task.filePath);

      await job.progress(50);

      await this.reservationsService.processReservations(fileStream);

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
