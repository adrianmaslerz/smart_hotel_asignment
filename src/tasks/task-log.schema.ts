import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskLogType } from './task-log-type.enum';

export type TaskLogDocument = HydratedDocument<TaskLog>;

@Schema({ timestamps: true })
export class TaskLog {
  @Prop({ type: Types.ObjectId, ref: 'Task', index: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: TaskLogType,
    default: TaskLogType.GENERAL,
    index: true,
  })
  type: TaskLogType;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TaskLogSchema = SchemaFactory.createForClass(TaskLog);
