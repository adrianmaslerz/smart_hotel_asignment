import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TasksRepository } from './tasks.repository';
import { Task, TaskDocument } from './task.schema';
import { TaskStatus } from './task-status.enum';
import { Types } from 'mongoose';

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let mockTaskModel: any;

  beforeEach(async () => {
    const mockTask = {
      save: jest.fn(),
    };

    mockTaskModel = jest.fn().mockImplementation(() => mockTask) as any;
    mockTaskModel.findById = jest.fn();
    mockTaskModel.updateOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksRepository,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
      ],
    }).compile();

    repository = module.get<TasksRepository>(TasksRepository);
  });

  describe('create', () => {
    it('should create and save task with provided data', async () => {
      const taskData = { filePath: 'file.xlsx' };
      const savedDoc = {
        _id: new Types.ObjectId(),
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      const mockTaskInstance = {
        save: jest.fn().mockResolvedValue(savedDoc),
      };

      mockTaskModel.mockImplementation(() => mockTaskInstance);

      const result = await repository.create(taskData);

      expect(mockTaskModel).toHaveBeenCalledWith(taskData);
      expect(mockTaskInstance.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedDoc);
    });

    it('should return saved task document', async () => {
      const taskData = { filePath: 'data.xlsx' };
      const savedTask = {
        _id: new Types.ObjectId(),
        filePath: 'data.xlsx',
        status: TaskStatus.PENDING,
        createdAt: new Date(),
      } as any;

      const mockTaskInstance = {
        save: jest.fn().mockResolvedValue(savedTask),
      };

      mockTaskModel.mockImplementation(() => mockTaskInstance);

      const result = await repository.create(taskData);

      expect(result).toEqual(savedTask);
    });

    it('should propagate save errors', async () => {
      const taskData = { filePath: 'file.xlsx' };
      const saveError = new Error('Save failed');

      const mockTaskInstance = {
        save: jest.fn().mockRejectedValue(saveError),
      };

      mockTaskModel.mockImplementation(() => mockTaskInstance);

      await expect(repository.create(taskData)).rejects.toThrow('Save failed');
    });

    it('should handle empty data object', async () => {
      const taskData = {};
      const savedDoc = {
        _id: new Types.ObjectId(),
        status: TaskStatus.PENDING,
      } as any;

      const mockTaskInstance = {
        save: jest.fn().mockResolvedValue(savedDoc),
      };

      mockTaskModel.mockImplementation(() => mockTaskInstance);

      await repository.create(taskData);

      expect(mockTaskModel).toHaveBeenCalledWith(taskData);
    });
  });

  describe('getById', () => {
    it('should retrieve task by id', async () => {
      const taskId = new Types.ObjectId();
      const mockTask = {
        _id: taskId,
        filePath: 'file.xlsx',
        status: TaskStatus.PENDING,
      } as any;

      const mockExec = jest.fn().mockResolvedValue(mockTask);
      mockTaskModel.findById.mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await repository.getById(taskId.toString());

      expect(mockTaskModel.findById).toHaveBeenCalledWith(taskId.toString());
      expect(mockExec).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      const taskId = new Types.ObjectId();

      const mockExec = jest.fn().mockResolvedValue(null);
      mockTaskModel.findById.mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await repository.getById(taskId.toString());

      expect(result).toBeNull();
    });

    it('should call findById with string task id', async () => {
      const taskId = '507f1f77bcf86cd799439011';
      const mockExec = jest.fn().mockResolvedValue(null);
      mockTaskModel.findById.mockReturnValue({
        exec: mockExec,
      } as any);

      await repository.getById(taskId);

      expect(mockTaskModel.findById).toHaveBeenCalledWith(taskId);
    });

    it('should propagate query errors', async () => {
      const taskId = new Types.ObjectId();
      const queryError = new Error('Query failed');

      const mockExec = jest.fn().mockRejectedValue(queryError);
      mockTaskModel.findById.mockReturnValue({
        exec: mockExec,
      } as any);

      await expect(repository.getById(taskId.toString())).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update task status by id', async () => {
      const taskId = new Types.ObjectId();
      const newStatus = TaskStatus.COMPLETED;

      mockTaskModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(taskId.toString(), newStatus);

      expect(mockTaskModel.updateOne).toHaveBeenCalledWith(
        { _id: taskId.toString() },
        { status: newStatus },
      );
    });

    it('should update status to IN_PROGRESS', async () => {
      const taskId = '507f1f77bcf86cd799439011';

      mockTaskModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(taskId, TaskStatus.IN_PROGRESS);

      expect(mockTaskModel.updateOne).toHaveBeenCalledWith(
        { _id: taskId },
        { status: TaskStatus.IN_PROGRESS },
      );
    });

    it('should update status to FAILED', async () => {
      const taskId = new Types.ObjectId();

      mockTaskModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(taskId.toString(), TaskStatus.FAILED);

      expect(mockTaskModel.updateOne).toHaveBeenCalledWith(
        { _id: taskId.toString() },
        { status: TaskStatus.FAILED },
      );
    });

    it('should propagate update errors', async () => {
      const taskId = new Types.ObjectId();
      const updateError = new Error('Update failed');

      mockTaskModel.updateOne.mockRejectedValue(updateError);

      await expect(
        repository.updateStatus(taskId.toString(), TaskStatus.COMPLETED),
      ).rejects.toThrow('Update failed');
    });

    it('should handle non-existent task id', async () => {
      const taskId = new Types.ObjectId();

      mockTaskModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(taskId.toString(), TaskStatus.COMPLETED);

      expect(mockTaskModel.updateOne).toHaveBeenCalled();
    });
  });

  describe('constructor', () => {
    it('should initialize with task model', () => {
      expect(repository).toBeDefined();
      expect((repository as any).taskModel).toBe(mockTaskModel);
    });
  });
});
