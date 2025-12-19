import { QueueName } from './queue-name.enum';

export interface QueueConfig {
  name: QueueName;
  defaultJobOptions: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean;
  };
}
