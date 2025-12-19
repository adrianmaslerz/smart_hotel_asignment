import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskLog, TaskLogDocument } from './task-log.schema';

@Injectable()
export class TaskLogRepository {
  constructor(
    @InjectModel(TaskLog.name)
    private taskLogModel: Model<TaskLogDocument>,
  ) {}

  async create(data: Partial<TaskLog>): Promise<TaskLogDocument> {
    const taskLog = new this.taskLogModel(data);
    return taskLog.save();
  }
}

