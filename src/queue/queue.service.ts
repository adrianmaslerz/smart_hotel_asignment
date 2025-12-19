import { Injectable } from '@nestjs/common';
import { QueueName } from './queue-name.enum';

@Injectable()
export abstract class QueueService {
  abstract addJob<T>(queueName: QueueName, data: T): Promise<void>;
}
