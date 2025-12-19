import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskLogRepository } from './task-log.repository';
import { TaskProcessor } from './task.processor';
import { Task, TaskSchema } from './task.schema';
import { TaskLog, TaskLogSchema } from './task-log.schema';
import { UploadModule } from '../upload/upload.module';
import { QueueModule } from '../queue/queue.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: TaskLog.name, schema: TaskLogSchema },
    ]),
    UploadModule,
    QueueModule,
    ReservationsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TaskLogRepository, TaskProcessor],
})
export class TasksModule {}
