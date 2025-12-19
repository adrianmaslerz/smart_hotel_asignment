import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { UploadService } from '../upload/upload.service';
import { QueueService } from '../queue/queue.service';
import { QueueName } from '../queue/queue-name.enum';
import { Task } from './task.schema';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskJobData } from './task-job.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly uploadService: UploadService,
    private readonly queueService: QueueService,
  ) {}

  async addTask(file: Express.Multer.File): Promise<TaskResponseDto> {
    const uploadResult = await this.uploadService.handleFileUpload(file);

    const taskData: Partial<Task> = {
      filePath: uploadResult.objectName,
    };

    const task = await this.tasksRepository.create(taskData);

    const jobData: TaskJobData = {
      taskId: task._id.toString(),
    };

    await this.queueService.addJob(QueueName.TASKS, jobData);

    return TaskResponseDto.fromDocument(task);
  }
}
