import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { TaskLogRepository } from './task-log.repository';
import { UploadService } from '../upload/upload.service';
import { QueueService } from '../queue/queue.service';
import { QueueName } from '../queue/queue-name.enum';
import { TaskLogType } from './task-log-type.enum';
import { Task } from './task.schema';
import { CreateTaskResponseDto } from './dto/create-task-response.dto';
import { TaskReportDto } from './dto/task-report.dto';
import { TaskLogDto } from './dto/task-log.dto';
import { TaskJobData } from './task-job.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskLogRepository: TaskLogRepository,
    private readonly uploadService: UploadService,
    private readonly queueService: QueueService,
  ) {}

  async addTask(file: Express.Multer.File): Promise<CreateTaskResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const uploadResult = await this.uploadService.handleFileUpload(file);

    const taskData: Partial<Task> = {
      filePath: uploadResult.objectName,
    };

    const task = await this.tasksRepository.create(taskData);

    const jobData: TaskJobData = {
      taskId: task._id.toString(),
    };

    await this.queueService.addJob(QueueName.TASKS, jobData);

    return {
      taskId: task._id.toString(),
    };
  }

  async getTaskStatus(taskId: string) {
    const task = await this.tasksRepository.getById(taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    return {
      status: task.status,
    };
  }

  async getTaskReport(taskId: string): Promise<TaskReportDto> {
    const task = await this.tasksRepository.getById(taskId);
    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const [generalLogs, entryLogs] = await Promise.all([
      this.taskLogRepository.findByTaskIdAndType(task._id),
      this.taskLogRepository.findByTaskIdAndType(task._id, TaskLogType.ENTRY),
    ]);

    return {
      general: generalLogs.map((log) => TaskLogDto.fromDocument(log)),
      entry: entryLogs.map((log) => TaskLogDto.fromDocument(log)),
    };
  }
}
