import { ApiProperty } from '@nestjs/swagger';
import { TaskLogType } from '../task-log-type.enum';
import { TaskLogDocument } from '../task-log.schema';

export class TaskLogDto {
  @ApiProperty({
    description: 'Task log ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Log message',
    example: 'Task processing started',
  })
  message: string;

  @ApiProperty({
    description: 'Log type',
    enum: TaskLogType,
    example: TaskLogType.GENERAL,
  })
  type: TaskLogType;

  @ApiProperty({
    description: 'Log creation date',
    example: '2024-12-19T10:30:45.123Z',
  })
  createdAt: Date;

  static fromDocument(log: TaskLogDocument): TaskLogDto {
    return {
      id: log._id.toString(),
      message: log.message,
      type: log.type,
      createdAt: log.createdAt,
    };
  }
}

