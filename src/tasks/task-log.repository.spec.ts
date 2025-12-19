import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskLogRepository } from './task-log.repository';
import { TaskLog, TaskLogDocument } from './task-log.schema';
import { TaskLogType } from './task-log-type.enum';
import { Types } from 'mongoose';

describe('TaskLogRepository', () => {
  let repository: TaskLogRepository;
  let mockTaskLogModel: any;

  beforeEach(async () => {
    const mockTaskLogInstance = {
      save: jest.fn(),
    };

    mockTaskLogModel = jest
      .fn()
      .mockImplementation(() => mockTaskLogInstance) as any;
    mockTaskLogModel.find = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskLogRepository,
        {
          provide: getModelToken(TaskLog.name),
          useValue: mockTaskLogModel,
        },
      ],
    }).compile();

    repository = module.get<TaskLogRepository>(TaskLogRepository);
  });

  describe('create', () => {
    it('should create and save task log with provided data', async () => {
      const taskLogData = {
        taskId: new Types.ObjectId(),
        message: 'Task started',
        type: TaskLogType.GENERAL,
      } as any;

      const savedDoc = {
        _id: new Types.ObjectId(),
        ...taskLogData,
        createdAt: new Date(),
      };

      const mockTaskLogInstance = {
        save: jest.fn().mockResolvedValue(savedDoc),
      };

      mockTaskLogModel.mockImplementation(() => mockTaskLogInstance);

      const result = await repository.create(taskLogData);

      expect(mockTaskLogModel).toHaveBeenCalledWith(taskLogData);
      expect(mockTaskLogInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedDoc);
    });

    it('should return saved task log document', async () => {
      const taskLogData = {
        taskId: new Types.ObjectId(),
        message: 'Entry processed',
        type: TaskLogType.ENTRY,
      } as any;

      const savedLog = {
        _id: new Types.ObjectId(),
        taskId: taskLogData.taskId,
        message: 'Entry processed',
        type: TaskLogType.ENTRY,
        createdAt: new Date(),
      } as any;

      const mockTaskLogInstance = {
        save: jest.fn().mockResolvedValue(savedLog),
      };

      mockTaskLogModel.mockImplementation(() => mockTaskLogInstance);

      const result = await repository.create(taskLogData);

      expect(result).toEqual(savedLog);
    });

    it('should propagate save errors', async () => {
      const taskLogData = {
        taskId: new Types.ObjectId(),
        message: 'Test log',
        type: TaskLogType.GENERAL,
      } as any;

      const saveError = new Error('Save failed');

      const mockTaskLogInstance = {
        save: jest.fn().mockRejectedValue(saveError),
      };

      mockTaskLogModel.mockImplementation(() => mockTaskLogInstance);

      await expect(repository.create(taskLogData)).rejects.toThrow(
        'Save failed',
      );
    });
  });

  describe('findByTaskIdAndType', () => {
    it('should find logs by taskId and type', async () => {
      const taskId = new Types.ObjectId();
      const type = TaskLogType.GENERAL;

      const mockLogs = [
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Log 1',
          type: TaskLogType.GENERAL,
          createdAt: new Date(),
        } as any,
      ];

      const mockExec = jest.fn().mockResolvedValue(mockLogs);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      const result = await repository.findByTaskIdAndType(taskId, type);

      expect(mockTaskLogModel.find).toHaveBeenCalledWith({ taskId, type });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLogs);
    });

    it('should use default type GENERAL when type not provided', async () => {
      const taskId = new Types.ObjectId();

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      await repository.findByTaskIdAndType(taskId);

      expect(mockTaskLogModel.find).toHaveBeenCalledWith({
        taskId,
        type: TaskLogType.GENERAL,
      });
    });

    it('should sort logs by createdAt descending', async () => {
      const taskId = new Types.ObjectId();

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      await repository.findByTaskIdAndType(taskId);

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return empty array when no logs found', async () => {
      const taskId = new Types.ObjectId();

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      const result = await repository.findByTaskIdAndType(taskId);

      expect(result).toEqual([]);
    });

    it('should return multiple logs sorted by creation date', async () => {
      const taskId = new Types.ObjectId();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const twoHoursAgo = new Date(now.getTime() - 7200000);

      const mockLogs = [
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Latest log',
          type: TaskLogType.GENERAL,
          createdAt: now,
        } as any,
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Middle log',
          type: TaskLogType.GENERAL,
          createdAt: oneHourAgo,
        } as any,
        {
          _id: new Types.ObjectId(),
          taskId,
          message: 'Oldest log',
          type: TaskLogType.GENERAL,
          createdAt: twoHoursAgo,
        } as any,
      ];

      const mockExec = jest.fn().mockResolvedValue(mockLogs);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      const result = await repository.findByTaskIdAndType(taskId);

      expect(result).toHaveLength(3);
      expect(result[0].message).toBe('Latest log');
    });

    it('should find logs by ENTRY type', async () => {
      const taskId = new Types.ObjectId();

      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      await repository.findByTaskIdAndType(taskId, TaskLogType.ENTRY);

      expect(mockTaskLogModel.find).toHaveBeenCalledWith({
        taskId,
        type: TaskLogType.ENTRY,
      });
    });

    it('should propagate query errors', async () => {
      const taskId = new Types.ObjectId();
      const queryError = new Error('Query failed');

      const mockExec = jest.fn().mockRejectedValue(queryError);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockTaskLogModel.find.mockReturnValue({ sort: mockSort });

      await expect(repository.findByTaskIdAndType(taskId)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with task log model', () => {
      expect(repository).toBeDefined();
      expect((repository as any).taskLogModel).toBe(mockTaskLogModel);
    });
  });
});
