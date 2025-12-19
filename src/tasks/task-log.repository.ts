import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskLog, TaskLogDocument } from './task-log.schema';
import { TaskLogType } from './task-log-type.enum';

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

  async findByTaskIdAndType(
    taskId: string,
    type: TaskLogType,
  ): Promise<TaskLogDocument[]> {
    return this.taskLogModel
      .find({ taskId, type })
      .sort({ createdAt: -1 })
      .exec();
  }
}

