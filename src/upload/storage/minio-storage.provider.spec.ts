import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { MinioStorageProvider } from './minio-storage.provider';

describe('MinioStorageProvider', () => {
  let provider: MinioStorageProvider;
  let mockMinioClient: jest.Mocked<Minio.Client>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockMinioClient = {
      putObject: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn().mockResolvedValue(new Readable()),
    } as unknown as jest.Mocked<Minio.Client>;

    mockConfigService = {
      get: jest.fn().mockReturnValue('test-bucket'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioStorageProvider,
        {
          provide: Minio.Client,
          useValue: mockMinioClient,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<MinioStorageProvider>(MinioStorageProvider);
  });

  describe('uploadFile', () => {
    it('should call putObject with correct parameters', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '/uploads',
        filename: 'document.pdf',
        path: '/uploads/document.pdf',
        buffer: Buffer.from('test content'),
        stream: new Readable(),
      };

      const objectName = '1234567890-document.pdf';

      await provider.uploadFile(mockFile, objectName);

      expect(mockMinioClient.putObject).toHaveBeenCalledTimes(1);
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        objectName,
        expect.any(Readable),
        1024,
        { 'Content-Type': 'application/pdf' },
      );
    });

    it('should return upload result with correct data', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        destination: '/uploads',
        filename: 'image.jpg',
        path: '/uploads/image.jpg',
        buffer: Buffer.from('test'),
        stream: new Readable(),
      };

      const objectName = '9999999999-image.jpg';
      mockMinioClient.putObject.mockResolvedValue(undefined as any);

      const result = await provider.uploadFile(mockFile, objectName);

      expect(result).toEqual({
        filename: 'image.jpg',
        objectName: '9999999999-image.jpg',
        size: 2048,
        mimetype: 'image/jpeg',
        bucket: 'test-bucket',
      });
    });

    it('should handle file size of 0', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'empty.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 0,
        destination: '/uploads',
        filename: 'empty.txt',
        path: '/uploads/empty.txt',
        buffer: Buffer.from(''),
        stream: new Readable(),
      };

      const objectName = 'empty.txt';
      mockMinioClient.putObject.mockResolvedValue(undefined as any);

      const result = await provider.uploadFile(mockFile, objectName);

      expect(result.size).toBe(0);
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        objectName,
        expect.any(Readable),
        0,
        { 'Content-Type': 'text/plain' },
      );
    });

    it('should propagate putObject errors', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        destination: '/uploads',
        filename: 'test.pdf',
        path: '/uploads/test.pdf',
        buffer: Buffer.from('test'),
        stream: new Readable(),
      };

      const uploadError = new Error('Minio upload failed');
      mockMinioClient.putObject.mockRejectedValue(uploadError);

      await expect(provider.uploadFile(mockFile, 'test.pdf')).rejects.toThrow(
        'Minio upload failed',
      );
    });

    it('should use bucket from config', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'doc.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 512,
        destination: '/uploads',
        filename: 'doc.xlsx',
        path: '/uploads/doc.xlsx',
        buffer: Buffer.from('test'),
        stream: new Readable(),
      };

      mockConfigService.get.mockReturnValue('custom-bucket');
      mockMinioClient.putObject.mockResolvedValue(undefined as any);

      const newProvider = new MinioStorageProvider(
        mockMinioClient,
        mockConfigService,
      );

      await newProvider.uploadFile(mockFile, 'doc.xlsx');

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'custom-bucket',
        'doc.xlsx',
        expect.any(Readable),
        512,
        expect.any(Object),
      );
    });
  });

  describe('getFileStream', () => {
    it('should call getObject with bucket and file path', async () => {
      const filePath = 'documents/file.pdf';
      const mockStream = new Readable();

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await provider.getFileStream(filePath);

      expect(mockMinioClient.getObject).toHaveBeenCalledTimes(1);
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'test-bucket',
        filePath,
      );
      expect(result).toBe(mockStream);
    });

    it('should return readable stream', async () => {
      const filePath = 'images/photo.jpg';
      const mockStream = new Readable();

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await provider.getFileStream(filePath);

      expect(result).toBeInstanceOf(Readable);
    });

    it('should propagate getObject errors', async () => {
      const filePath = 'nonexistent/file.pdf';

      mockMinioClient.getObject.mockRejectedValue(new Error('File not found'));

      await expect(provider.getFileStream(filePath)).rejects.toThrow(
        'File not found',
      );
    });

    it('should pass exact file path to getObject', async () => {
      const filePath = '1234567890-document.pdf';
      const mockStream = new Readable();

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      await provider.getFileStream(filePath);

      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'test-bucket',
        '1234567890-document.pdf',
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with minio client and config service', () => {
      expect(provider).toBeDefined();
      expect((provider as any).minioClient).toBe(mockMinioClient);
      expect((provider as any).configService).toBe(mockConfigService);
    });

    it('should set bucket name from config', () => {
      mockConfigService.get.mockReturnValue('my-bucket');

      const newProvider = new MinioStorageProvider(
        mockMinioClient,
        mockConfigService,
      );

      expect((newProvider as any).bucketName).toBe('my-bucket');
    });

    it('should use default bucket name when config is not set', () => {
      mockConfigService.get.mockReturnValue(null);

      const newProvider = new MinioStorageProvider(
        mockMinioClient,
        mockConfigService,
      );

      expect((newProvider as any).bucketName).toBe('smart-hotel');
    });
  });
});
