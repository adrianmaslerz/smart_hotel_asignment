import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskLogRepository } from './task-log.repository';
import { UploadService } from '../upload/upload.service';
import { QueueService } from '../queue/queue.service';
import { QueueName } from '../queue/queue-name.enum';
import { TaskLogType } from './task-log-type.enum';
import { Types } from 'mongoose';

describe('TasksService', () => {
  let service: TasksService;
  let mockTasksRepository: jest.Mocked<TasksRepository>;
  let mockTaskLogRepository: jest.Mocked<TaskLogRepository>;
  let mockUploadService: jest.Mocked<UploadService>;
  let mockQueueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    mockTasksRepository = {
      create: jest.fn(),
      getById: jest.fn(),
    } as unknown as jest.Mocked<TasksRepository>;

    mockTaskLogRepository = {
      findByTaskIdAndType: jest.fn(),
    } as unknown as jest.Mocked<TaskLogRepository>;

    mockUploadService = {
      handleFileUpload: jest.fn(),
      getFileStream: jest.fn(),
    } as unknown as jest.Mocked<UploadService>;

    mockQueueService = {
      addJob: jest.fn(),
    } as unknown as jest.Mocked<QueueService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useValue: mockTasksRepository,
        },
        {
          provide: TaskLogRepository,
          useValue: mockTaskLogRepository,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('addTask', () => {
    it('should throw BadRequestException when file is not provided', async () => {
      await expect(service.addTask(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload file and create task', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'reservations.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 1024,
        destination: '/uploads',
        filename: 'reservations.xlsx',
        path: '/uploads/reservations.xlsx',
        buffer: Buffer.from('test'),
        stream: null as any,
      };

      const uploadResult = {
        filename: 'reservations.xlsx',
        objectName: '1234567890-reservations.xlsx',
        size: 1024,
        mimetype: 'application/vnd.ms-excel',
        bucket: 'default',
      };

      const taskId = new Types.ObjectId();
      const createdTask = {
        _id: taskId,
        filePath: '1234567890-reservations.xlsx',
        status: 'pending',
      } as any;

      mockUploadService.handleFileUpload.mockResolvedValue(uploadResult);
      mockTasksRepository.create.mockResolvedValue(createdTask);
      mockQueueService.addJob.mockResolvedValue(undefined);

      const result = await service.addTask(mockFile);

      expect(result).toEqual({ taskId: taskId.toString() });
      expect(mockUploadService.handleFileUpload).toHaveBeenCalledWith(mockFile);
      expect(mockTasksRepository.create).toHaveBeenCalledWith({
        filePath: '1234567890-reservations.xlsx',
      });
    });

    it('should add job to queue with task id', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'data.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 512,
        destination: '/uploads',
        filename: 'data.xlsx',
        path: '/uploads/data.xlsx',
        buffer: Buffer.from('test'),
        stream: null as any,
      };

      const uploadResult = {
        filename: 'data.xlsx',
        objectName: '9999999999-data.xlsx',
        size: 512,
        mimetype: 'application/vnd.ms-excel',
        bucket: 'default',
      };

      const taskId = new Types.ObjectId();
      const createdTask = {
        _id: taskId,
        filePath: '9999999999-data.xlsx',
        status: 'pending',
      } as any;

      mockUploadService.handleFileUpload.mockResolvedValue(uploadResult);
      mockTasksRepository.create.mockResolvedValue(createdTask);
      mockQueueService.addJob.mockResolvedValue(undefined);

      await service.addTask(mockFile);

      expect(mockQueueService.addJob).toHaveBeenCalledWith(QueueName.TASKS, {
        taskId: taskId.toString(),
      });
    });

    it('should propagate upload service errors', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 1024,
        destination: '/uploads',
        filename: 'test.xlsx',
        path: '/uploads/test.xlsx',
        buffer: Buffer.from('test'),
        stream: null as any,
      };

      const uploadError = new Error('Upload failed');
      mockUploadService.handleFileUpload.mockRejectedValue(uploadError);

      await expect(service.addTask(mockFile)).rejects.toThrow('Upload failed');
    });

    it('should propagate repository errors', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 1024,
        destination: '/uploads',
        filename: 'test.xlsx',
        path: '/uploads/test.xlsx',
        buffer: Buffer.from('test'),
        stream: null as any,
      };

      const uploadResult = {
        filename: 'test.xlsx',
        objectName: '1111111111-test.xlsx',
        size: 1024,
        mimetype: 'application/vnd.ms-excel',
        bucket: 'default',
      };

      const repositoryError = new Error('Database error');
      mockUploadService.handleFileUpload.mockResolvedValue(uploadResult);
      mockTasksRepository.create.mockRejectedValue(repositoryError);

      await expect(service.addTask(mockFile)).rejects.toThrow('Database error');
    });

    it('should propagate queue service errors', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 1024,
        destination: '/uploads',
        filename: 'test.xlsx',
        path: '/uploads/test.xlsx',
        buffer: Buffer.from('test'),
        stream: null as any,
      };

      const uploadResult = {
        filename: 'test.xlsx',
        objectName: '2222222222-test.xlsx',
        size: 1024,
        mimetype: 'application/vnd.ms-excel',
        bucket: 'default',
      };

      const taskId = new Types.ObjectId();
      const createdTask = {
        _id: taskId,
        filePath: '2222222222-test.xlsx',
        status: 'pending',
      } as any;

      const queueError = new Error('Queue error');
      mockUploadService.handleFileUpload.mockResolvedValue(uploadResult);
      mockTasksRepository.create.mockResolvedValue(createdTask);
      mockQueueService.addJob.mockRejectedValue(queueError);

      await expect(service.addTask(mockFile)).rejects.toThrow('Queue error');
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status', async () => {
      const taskId = new Types.ObjectId();
      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: 'completed',
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);

      const result = await service.getTaskStatus(taskId.toString());

      expect(result).toEqual({ status: 'completed' });
      expect(mockTasksRepository.getById).toHaveBeenCalledWith(
        taskId.toString(),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = new Types.ObjectId();
      mockTasksRepository.getById.mockResolvedValue(null as any);

      await expect(service.getTaskStatus(taskId.toString())).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTaskStatus(taskId.toString())).rejects.toThrow(
        `Task ${taskId.toString()} not found`,
      );
    });

    it('should propagate repository errors', async () => {
      const taskId = new Types.ObjectId();
      const repositoryError = new Error('Database error');

      mockTasksRepository.getById.mockRejectedValue(repositoryError);

      await expect(service.getTaskStatus(taskId.toString())).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getTaskReport', () => {
    it('should return task report with general and entry logs', async () => {
      const taskId = new Types.ObjectId();
      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: 'completed',
      } as any;

      const generalLog = {
        _id: new Types.ObjectId(),
        taskId,
        message: 'Processing started',
        type: TaskLogType.GENERAL,
        createdAt: new Date(),
      } as any;

      const entryLog = {
        _id: new Types.ObjectId(),
        taskId,
        message: 'Entry 1 processed',
        type: TaskLogType.ENTRY,
        createdAt: new Date(),
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockTaskLogRepository.findByTaskIdAndType
        .mockResolvedValueOnce([generalLog])
        .mockResolvedValueOnce([entryLog]);

      const result = await service.getTaskReport(taskId.toString());

      expect(result.general).toHaveLength(1);
      expect(result.entry).toHaveLength(1);
      expect(mockTasksRepository.getById).toHaveBeenCalledWith(
        taskId.toString(),
      );
    });

    it('should call findByTaskIdAndType with correct parameters', async () => {
      const taskId = new Types.ObjectId();
      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: 'completed',
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockTaskLogRepository.findByTaskIdAndType.mockResolvedValue([]);

      await service.getTaskReport(taskId.toString());

      expect(mockTaskLogRepository.findByTaskIdAndType).toHaveBeenNthCalledWith(
        1,
        taskId,
      );
      expect(mockTaskLogRepository.findByTaskIdAndType).toHaveBeenNthCalledWith(
        2,
        taskId,
        TaskLogType.ENTRY,
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = new Types.ObjectId();
      mockTasksRepository.getById.mockResolvedValue(null as any);

      await expect(service.getTaskReport(taskId.toString())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle multiple logs', async () => {
      const taskId = new Types.ObjectId();
      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: 'completed',
      } as any;

      const logs = [
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Log 1',
          type: TaskLogType.GENERAL,
          createdAt: new Date(),
        } as any,
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Log 2',
          type: TaskLogType.GENERAL,
          createdAt: new Date(),
        } as any,
      ];

      mockTasksRepository.getById.mockResolvedValue(task);
      mockTaskLogRepository.findByTaskIdAndType
        .mockResolvedValueOnce(logs)
        .mockResolvedValueOnce([]);

      const result = await service.getTaskReport(taskId.toString());

      expect(result.general).toHaveLength(2);
      expect(result.entry).toHaveLength(0);
    });

    it('should propagate repository errors', async () => {
      const taskId = new Types.ObjectId();
      const repositoryError = new Error('Database error');

      mockTasksRepository.getById.mockRejectedValue(repositoryError);

      await expect(service.getTaskReport(taskId.toString())).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with all dependencies', () => {
      expect(service).toBeDefined();
      expect((service as any).tasksRepository).toBe(mockTasksRepository);
      expect((service as any).taskLogRepository).toBe(mockTaskLogRepository);
      expect((service as any).uploadService).toBe(mockUploadService);
      expect((service as any).queueService).toBe(mockQueueService);
    });
  });
});
