import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import * as Bull from 'bull';
import { BullQueueService } from './bull-queue.service';
import { QueueName } from './queue-name.enum';
import { QUEUE_CONFIGS } from './queue.config';

describe('BullQueueService', () => {
  let service: BullQueueService;
  let mockTasksQueue: jest.Mocked<Bull.Queue>;

  beforeEach(async () => {
    mockTasksQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Bull.Queue>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullQueueService,
        {
          provide: getQueueToken(QueueName.TASKS),
          useValue: mockTasksQueue,
        },
      ],
    }).compile();

    service = module.get<BullQueueService>(BullQueueService);
  });

  describe('addJob', () => {
    it('should add job to tasks queue with correct data and options', async () => {
      const testData = { id: 1, name: 'test' };
      const expectedOptions = QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions;

      await service.addJob(QueueName.TASKS, testData);

      expect(mockTasksQueue.add).toHaveBeenCalledTimes(1);
      expect(mockTasksQueue.add).toHaveBeenCalledWith(
        testData,
        expectedOptions,
      );
    });

    it('should handle generic type parameter', async () => {
      interface CustomType {
        customField: string;
        count: number;
      }

      const testData: CustomType = { customField: 'value', count: 42 };
      const expectedOptions = QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions;

      await service.addJob<CustomType>(QueueName.TASKS, testData);

      expect(mockTasksQueue.add).toHaveBeenCalledWith(
        testData,
        expectedOptions,
      );
    });

    it('should throw error when queue config not found', async () => {
      const testData = { data: 'test' };
      const invalidQueueName = 'invalid_queue' as QueueName;

      await expect(service.addJob(invalidQueueName, testData)).rejects.toThrow(
        'Queue invalid_queue not found',
      );

      expect(mockTasksQueue.add).not.toHaveBeenCalled();
    });

    it('should call queue.add and propagate its errors', async () => {
      const addError = new Error('Queue operation failed');
      mockTasksQueue.add.mockRejectedValueOnce(addError);

      await expect(
        service.addJob(QueueName.TASKS, { data: 'test' }),
      ).rejects.toThrow('Queue operation failed');
    });

    it('should handle various data types', async () => {
      const stringData = 'test string';
      const numberData = 42;
      const arrayData = [1, 2, 3];
      const objectData = { nested: { value: true } };

      const expectedOptions = QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions;

      await service.addJob(QueueName.TASKS, stringData);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        1,
        stringData,
        expectedOptions,
      );

      await service.addJob(QueueName.TASKS, numberData);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        2,
        numberData,
        expectedOptions,
      );

      await service.addJob(QueueName.TASKS, arrayData);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        3,
        arrayData,
        expectedOptions,
      );

      await service.addJob(QueueName.TASKS, objectData);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        4,
        objectData,
        expectedOptions,
      );
    });

    it('should handle null and undefined data', async () => {
      const expectedOptions = QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions;

      await service.addJob(QueueName.TASKS, null);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        1,
        null,
        expectedOptions,
      );

      await service.addJob(QueueName.TASKS, undefined);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        2,
        undefined,
        expectedOptions,
      );
    });

    it('should use correct default job options from config', async () => {
      const testData = { test: 'data' };
      const config = QUEUE_CONFIGS[QueueName.TASKS];

      await service.addJob(QueueName.TASKS, testData);

      expect(mockTasksQueue.add).toHaveBeenCalledWith(
        testData,
        expect.objectContaining({
          attempts: config.defaultJobOptions.attempts,
          backoff: config.defaultJobOptions.backoff,
          removeOnComplete: config.defaultJobOptions.removeOnComplete,
        }),
      );
    });
  });

  describe('getQueueByName', () => {
    it('should return tasks queue when QueueName.TASKS is provided', () => {
      const queue = (service as any).getQueueByName(QueueName.TASKS);

      expect(queue).toBe(mockTasksQueue);
    });

    it('should throw error when invalid queue name is provided', () => {
      const invalidQueueName = 'invalid' as any;

      expect(() => {
        (service as any).getQueueByName(invalidQueueName);
      }).toThrow(`Queue ${invalidQueueName as string} not found`);
    });

    it('should throw error with correct message format', () => {
      const testQueueName = 'nonexistent';

      expect(() => {
        (service as any).getQueueByName(testQueueName);
      }).toThrow(`Queue ${testQueueName} not found`);
    });

    it('should be called by addJob with correct parameter', async () => {
      const getQueueByNameSpy = jest.spyOn(service as any, 'getQueueByName');

      await service.addJob(QueueName.TASKS, { data: 'test' });

      expect(getQueueByNameSpy).toHaveBeenCalledWith(QueueName.TASKS);
      expect(getQueueByNameSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('constructor', () => {
    it('should initialize with tasks queue', () => {
      expect(service).toBeDefined();
      expect((service as any).tasksQueue).toBe(mockTasksQueue);
    });

    it('should extend QueueService', () => {
      const QueueService = require('./queue.service').QueueService;
      expect(service).toBeInstanceOf(QueueService);
    });
  });

  describe('integration', () => {
    it('should complete full addJob flow successfully', async () => {
      const testData = { jobId: 123, action: 'process' };
      const getQueueByNameSpy = jest.spyOn(service as any, 'getQueueByName');

      await service.addJob(QueueName.TASKS, testData);

      expect(getQueueByNameSpy).toHaveBeenCalledWith(QueueName.TASKS);
      expect(mockTasksQueue.add).toHaveBeenCalledWith(
        testData,
        QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions,
      );
    });

    it('should handle sequential job additions', async () => {
      const data1 = { id: 1 };
      const data2 = { id: 2 };
      const data3 = { id: 3 };
      const expectedOptions = QUEUE_CONFIGS[QueueName.TASKS].defaultJobOptions;

      await service.addJob(QueueName.TASKS, data1);
      await service.addJob(QueueName.TASKS, data2);
      await service.addJob(QueueName.TASKS, data3);

      expect(mockTasksQueue.add).toHaveBeenCalledTimes(3);
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        1,
        data1,
        expectedOptions,
      );
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        2,
        data2,
        expectedOptions,
      );
      expect(mockTasksQueue.add).toHaveBeenNthCalledWith(
        3,
        data3,
        expectedOptions,
      );
    });
  });
});
