import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskResponseDto } from './dto/create-task-response.dto';
import { TaskStatusDto } from './dto/task-status.dto';
import { createUploadConfig } from '../upload/upload.utils';
import { MimeType } from '../upload/mime-type.enum';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('upload')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task successfully created',
    type: CreateTaskResponseDto,
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

  @Get('status/:taskId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task status',
    type: TaskStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
  })
  async getTaskStatus(@Param('taskId') taskId: string) {
    return await this.tasksService.getTaskStatus(taskId);
  }
}
