import { QueueName } from './queue-name.enum';
import { QueueConfig } from './queue-config.interface';

export const QUEUE_CONFIGS: Record<QueueName, QueueConfig> = {
  [QueueName.TASKS]: {
    name: QueueName.TASKS,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    },
  },
};
