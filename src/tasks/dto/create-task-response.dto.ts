import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskResponseDto {
  @ApiProperty({
    description: 'Created task ID',
    example: '507f1f77bcf86cd799439011',
  })
  taskId: string;
}
