import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QueueName } from '../queue/queue-name.enum';
import { TaskJobData } from './task-job.interface';

@Processor(QueueName.TASKS)
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  @Process()
  async processTask(job: Job<TaskJobData>): Promise<void> {
    this.logger.debug(`Processing task job ${job.id} with data:`, job.data);

    try {
      const { taskId, filePath } = job.data;

      this.logger.log(`Processing file: ${filePath} for task: ${taskId}`);

      await job.progress(50);

      await job.progress(100);
      this.logger.log(`Task ${taskId} processed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process task job ${job.id}:`, error);
      throw error;
    }
  }
}
