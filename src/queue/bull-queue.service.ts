import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { QueueService } from './queue.service';
import { QueueName } from './queue-name.enum';
import { QUEUE_CONFIGS } from './queue.config';

@Injectable()
export class BullQueueService extends QueueService {
  constructor(@InjectQueue(QueueName.TASKS) private tasksQueue: Bull.Queue) {
    super();
  }

  async addJob<T>(queueName: QueueName, data: T): Promise<void> {
    const queue = this.getQueueByName(queueName);
    const config = QUEUE_CONFIGS[queueName];

    if (!config) {
      throw new Error(`Queue config for ${queueName} not found`);
    }

    await queue.add(data, config.defaultJobOptions);
  }

  private getQueueByName(queueName: QueueName): Bull.Queue {
    if (queueName === QueueName.TASKS) {
      return this.tasksQueue;
    }
    throw new Error(`Queue ${queueName as string} not found`);
  }
}
