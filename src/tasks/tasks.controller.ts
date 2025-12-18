import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { UploadService } from '../upload/upload.service';
import { createUploadConfig } from '../upload/upload.config';
import { MimeType } from '../upload/mime-type.enum';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('upload')
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.handleFileUpload(file);
  }
}








