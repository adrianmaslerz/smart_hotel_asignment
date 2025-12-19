import { ApiProperty } from '@nestjs/swagger';
import { TaskLogDto } from './task-log.dto';

export class TaskReportDto {
  @ApiProperty({
    description: 'General logs section',
    type: [TaskLogDto],
  })
  general: TaskLogDto[];

  @ApiProperty({
    description: 'Entry logs section',
    type: [TaskLogDto],
  })
  entry: TaskLogDto[];
}
