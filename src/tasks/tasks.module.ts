import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskProcessor } from './task.processor';
import { Task, TaskSchema } from './task.schema';
import { UploadModule } from '../upload/upload.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    UploadModule,
    QueueModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TaskProcessor],
})
export class TasksModule {}
