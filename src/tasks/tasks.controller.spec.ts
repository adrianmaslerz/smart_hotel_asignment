import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Types } from 'mongoose';

describe('TasksController', () => {
  let controller: TasksController;
  let mockTasksService: jest.Mocked<TasksService>;

  beforeEach(async () => {
    mockTasksService = {
      addTask: jest.fn(),
      getTaskStatus: jest.fn(),
      getTaskReport: jest.fn(),
    } as unknown as jest.Mocked<TasksService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  describe('addTask', () => {
    it('should call tasksService.addTask with file', async () => {
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

      const taskId = new Types.ObjectId();
      mockTasksService.addTask.mockResolvedValue({
        taskId: taskId.toString(),
      });

      await controller.addTask(mockFile);

      expect(mockTasksService.addTask).toHaveBeenCalledWith(mockFile);
      expect(mockTasksService.addTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTaskStatus', () => {
    it('should call tasksService.getTaskStatus with taskId', async () => {
      const taskId = '507f1f77bcf86cd799439011';
      mockTasksService.getTaskStatus.mockResolvedValue({
        status: 'PENDING',
      } as any);

      await controller.getTaskStatus(taskId);

      expect(mockTasksService.getTaskStatus).toHaveBeenCalledWith(taskId);
      expect(mockTasksService.getTaskStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTaskReport', () => {
    it('should call tasksService.getTaskReport with taskId', async () => {
      const taskId = '507f1f77bcf86cd799439011';
      mockTasksService.getTaskReport.mockResolvedValue({
        general: [],
        entry: [],
      } as any);

      await controller.getTaskReport(taskId);

      expect(mockTasksService.getTaskReport).toHaveBeenCalledWith(taskId);
      expect(mockTasksService.getTaskReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('constructor', () => {
    it('should initialize with TasksService', () => {
      expect(controller).toBeDefined();
      expect((controller as any).tasksService).toBe(mockTasksService);
    });
  });
});
