import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { UploadService } from '../upload/upload.service';
import { Task } from './task.schema';
import { TaskResponseDto } from './dto/task-response.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly uploadService: UploadService,
  ) {}

  async addTask(file: Express.Multer.File): Promise<TaskResponseDto> {
    const uploadResult = await this.uploadService.handleFileUpload(file);

    const taskData: Partial<Task> = {
      filePath: uploadResult.objectName,
    };

    const task = await this.tasksRepository.create(taskData);

    return TaskResponseDto.fromDocument(task);
  }
}
