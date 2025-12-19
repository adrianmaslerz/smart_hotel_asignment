import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { TaskResponseDto } from './dto/task-response.dto';
import { createUploadConfig } from '../upload/upload.utils';
import { MimeType } from '../upload/mime-type.enum';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('upload')
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
    type: TaskResponseDto,
  })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createUploadConfig({
        allowedMimeTypes: [MimeType.XLSX],
        maxFileSize: 10 * 1024 * 1024, // 10MB
      }),
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async addTask(@UploadedFile() file: Express.Multer.File) {
    return await this.tasksService.addTask(file);
  }
}
