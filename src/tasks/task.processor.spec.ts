import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { Types } from 'mongoose';
import { TaskProcessor } from './task.processor';
import { TasksRepository } from './tasks.repository';
import { TaskLogRepository } from './task-log.repository';
import { UploadService } from '../upload/upload.service';
import { ReservationsService } from '../reservations/reservations.service';
import { TaskStatus } from './task-status.enum';
import { TaskLogType } from './task-log-type.enum';

describe('TaskProcessor', () => {
  let processor: TaskProcessor;
  let mockTasksRepository: jest.Mocked<TasksRepository>;
  let mockTaskLogRepository: jest.Mocked<TaskLogRepository>;
  let mockUploadService: jest.Mocked<UploadService>;
  let mockReservationsService: jest.Mocked<ReservationsService>;
  let mockJob: any;

  beforeEach(async () => {
    mockTasksRepository = {
      getById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<TasksRepository>;

    mockTaskLogRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<TaskLogRepository>;

    mockUploadService = {
      getFileStream: jest.fn(),
    } as unknown as jest.Mocked<UploadService>;

    mockReservationsService = {
      processReservations: jest.fn(),
    } as unknown as jest.Mocked<ReservationsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskProcessor,
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
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    processor = module.get<TaskProcessor>(TaskProcessor);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    mockJob = {
      id: 'job-1',
      data: { taskId: new Types.ObjectId().toString() },
      progress: jest.fn().mockResolvedValue(undefined),
      attemptsMade: 1,
    };
  });

  describe('processTask', () => {
    it('should process task successfully', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };

      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      const mockStream = new Readable();

      mockTasksRepository.getById.mockResolvedValue(task);
      mockUploadService.getFileStream.mockResolvedValue(mockStream);
      mockReservationsService.processReservations.mockResolvedValue(undefined);
      mockTasksRepository.updateStatus.mockResolvedValue(undefined);

      await processor.processTask(mockJob);

      expect(mockTasksRepository.getById).toHaveBeenCalledWith(taskId.toString());
      expect(mockTasksRepository.updateStatus).toHaveBeenNthCalledWith(
        1,
        taskId.toString(),
        TaskStatus.IN_PROGRESS,
      );
      expect(mockUploadService.getFileStream).toHaveBeenCalledWith('file.xlsx');
      expect(mockReservationsService.processReservations).toHaveBeenCalled();
      expect(mockTasksRepository.updateStatus).toHaveBeenNthCalledWith(
        2,
        taskId.toString(),
        TaskStatus.COMPLETED,
      );
    });

    it('should throw error when task not found', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };

      mockTasksRepository.getById.mockResolvedValue(null as any);

      await expect(processor.processTask(mockJob)).rejects.toThrow(
        `Task ${taskId.toString()} not found`,
      );
    });

    it('should throw error when task is not PENDING', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };

      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.COMPLETED,
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockTaskLogRepository.create.mockResolvedValue(undefined as any);

      await expect(processor.processTask(mockJob)).rejects.toThrow(
        `Task ${taskId.toString()} is not in PENDING status`,
      );

      expect(mockTaskLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId,
          message: expect.stringContaining('not in PENDING status'),
          type: TaskLogType.GENERAL,
        }),
      );
    });

    it('should update job progress during processing', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };

      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockUploadService.getFileStream.mockResolvedValue(new Readable());
      mockReservationsService.processReservations.mockResolvedValue(undefined);
      mockTasksRepository.updateStatus.mockResolvedValue(undefined);

      await processor.processTask(mockJob);

      expect(mockJob.progress).toHaveBeenNthCalledWith(1, 10);
      expect(mockJob.progress).toHaveBeenNthCalledWith(2, 30);
      expect(mockJob.progress).toHaveBeenNthCalledWith(3, 50);
      expect(mockJob.progress).toHaveBeenNthCalledWith(4, 100);
    });

    it('should mark task as FAILED after max attempts', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };
      mockJob.attemptsMade = 3;

      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockUploadService.getFileStream.mockResolvedValue(new Readable());
      mockReservationsService.processReservations.mockRejectedValue(
        new Error('Processing failed'),
      );

      await expect(processor.processTask(mockJob)).rejects.toThrow(
        'Processing failed',
      );

      expect(mockTasksRepository.updateStatus).toHaveBeenCalledWith(
        taskId.toString(),
        TaskStatus.FAILED,
      );
    });

    it('should not mark task as FAILED if not max attempts', async () => {
      const taskId = new Types.ObjectId();
      mockJob.data = { taskId: taskId.toString() };
      mockJob.attemptsMade = 1;

      const task = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      mockTasksRepository.getById.mockResolvedValue(task);
      mockUploadService.getFileStream.mockResolvedValue(new Readable());
      mockReservationsService.processReservations.mockRejectedValue(
        new Error('Processing failed'),
      );

      await expect(processor.processTask(mockJob)).rejects.toThrow();

      const updateStatusCalls = mockTasksRepository.updateStatus.mock.calls;
      const lastCall = updateStatusCalls[updateStatusCalls.length - 1];
      expect(lastCall[1]).not.toBe(TaskStatus.FAILED);
    });
  });

  describe('processReservationsWithLogging', () => {
    it('should call reservations service with onFailure callback', async () => {
      const taskId = new Types.ObjectId();
      const mockStream = new Readable();

      mockReservationsService.processReservations.mockResolvedValue(undefined);

      await (processor as any).processReservationsWithLogging(mockStream, taskId);

      expect(mockReservationsService.processReservations).toHaveBeenCalledWith(
        mockStream,
        expect.any(Function),
      );
    });

    it('should create log entry on failure callback', async () => {
      const taskId = new Types.ObjectId();
      const mockStream = new Readable();

      let onFailureCallback: any;
      mockReservationsService.processReservations.mockImplementation(
        async (stream, callback) => {
          onFailureCallback = callback;
        },
      );
      mockTaskLogRepository.create.mockResolvedValue(undefined as any);

      await (processor as any).processReservationsWithLogging(mockStream, taskId);

      await onFailureCallback(5, 'Invalid email');

      expect(mockTaskLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId,
          message: 'Row 5: Invalid email',
          type: TaskLogType.ENTRY,
        }),
      );
    });

    it('should create error log when reservations processing fails', async () => {
      const taskId = new Types.ObjectId();
      const mockStream = new Readable();
      const processingError = new Error('Processing error');

      mockReservationsService.processReservations.mockRejectedValue(
        processingError,
      );
      mockTaskLogRepository.create.mockResolvedValue(undefined as any);

      await expect(
        (processor as any).processReservationsWithLogging(mockStream, taskId),
      ).rejects.toThrow('Processing error');

      expect(mockTaskLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId,
          message: expect.stringContaining('Error processing reservations'),
          type: TaskLogType.GENERAL,
        }),
      );
    });

    it('should propagate reservations service errors', async () => {
      const taskId = new Types.ObjectId();
      const mockStream = new Readable();
      const error = new Error('Reservations failed');

      mockReservationsService.processReservations.mockRejectedValue(error);
      mockTaskLogRepository.create.mockResolvedValue(undefined as any);

      await expect(
        (processor as any).processReservationsWithLogging(mockStream, taskId),
      ).rejects.toThrow('Reservations failed');
    });
  });

  describe('constructor', () => {
    it('should initialize with all dependencies', () => {
      expect(processor).toBeDefined();
      expect((processor as any).tasksRepository).toBe(mockTasksRepository);
      expect((processor as any).taskLogRepository).toBe(mockTaskLogRepository);
      expect((processor as any).uploadService).toBe(mockUploadService);
      expect((processor as any).reservationsService).toBe(
        mockReservationsService,
      );
    });
  });
});

