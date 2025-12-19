import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
  ) {}

  async create(data: Partial<Task>): Promise<TaskDocument> {
    const task = new this.taskModel(data);
    return task.save();
  }

  async getById(taskId: string): Promise<TaskDocument | null> {
    return this.taskModel.findById(taskId).exec();
  }

  async updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    await this.taskModel.updateOne({ _id: taskId }, { status });
  }
}
