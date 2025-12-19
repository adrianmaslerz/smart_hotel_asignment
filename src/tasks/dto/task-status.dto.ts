import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';

export class TaskStatusDto {
  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.PENDING,
  })
  status: TaskStatus;
}
