import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskLogType } from './task-log-type.enum';

export type TaskLogDocument = HydratedDocument<TaskLog>;

@Schema({ timestamps: true })
export class TaskLog {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: TaskLogType, default: TaskLogType.GENERAL })
  type: TaskLogType;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TaskLogSchema = SchemaFactory.createForClass(TaskLog);

