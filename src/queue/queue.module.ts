import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { BullQueueService } from './bull-queue.service';
import { QueueName } from './queue-name.enum';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.TASKS,
    }),
  ],
  providers: [
    {
      provide: QueueService,
      useClass: BullQueueService,
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
