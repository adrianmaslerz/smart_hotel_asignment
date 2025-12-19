import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';
import { TaskDocument } from '../task.schema';

export class TaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    example: '507f1f77bcf86cd799439011',
  })
  taskId: string;

  @ApiProperty({
    description: 'File path in storage',
    example: '1671234567890-reservations.xlsx',
  })
  filePath: string;

  @ApiProperty({
    description: 'Task processing status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Task creation date',
    example: '2023-12-17T10:30:00Z',
  })
  createdAt: Date;

  static fromDocument(doc: TaskDocument): TaskResponseDto {
    return {
      taskId: doc._id.toString(),
      filePath: doc.filePath,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  }
}
