import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { UploadService } from './upload.service';
import { StorageProvider } from './storage/storage-provider.interface';
import { UploadResult } from './upload-result.interface';

describe('UploadService', () => {
  let service: UploadService;
  let mockStorageProvider: jest.Mocked<StorageProvider>;

  beforeEach(async () => {
    mockStorageProvider = {
      uploadFile: jest.fn(),
      getFileStream: jest.fn(),
    } as unknown as jest.Mocked<StorageProvider>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: StorageProvider,
          useValue: mockStorageProvider,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  describe('handleFileUpload', () => {
    it('should call uploadFile with file and generated object name', async () => {
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

      const mockResult: UploadResult = {
        filename: 'test.pdf',
        objectName: '1234567890-test.pdf',
        size: 1024,
        mimetype: 'application/pdf',
        bucket: 'default',
      };

      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      mockStorageProvider.uploadFile.mockResolvedValue(mockResult);

      const result = await service.handleFileUpload(mockFile);

      expect(result).toEqual(mockResult);
      expect(mockStorageProvider.uploadFile).toHaveBeenCalledWith(
        mockFile,
        '1234567890-test.pdf',
      );
    });

    it('should return result from storage provider', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.xlsx',
        encoding: '7bit',
        mimetype: 'application/vnd.ms-excel',
        size: 2048,
        destination: '/uploads',
        filename: 'document.xlsx',
        path: '/uploads/document.xlsx',
        buffer: Buffer.from('test'),
        stream: new Readable(),
      };

      const mockResult: UploadResult = {
        filename: 'document.xlsx',
        objectName: '9999999999-document.xlsx',
        size: 2048,
        mimetype: 'application/vnd.ms-excel',
        bucket: 'files',
      };

      jest.spyOn(Date, 'now').mockReturnValue(9999999999);
      mockStorageProvider.uploadFile.mockResolvedValue(mockResult);

      const result = await service.handleFileUpload(mockFile);

      expect(result).toEqual(mockResult);
    });

    it('should propagate upload errors', async () => {
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

      const uploadError = new Error('Upload failed');
      mockStorageProvider.uploadFile.mockRejectedValue(uploadError);

      await expect(service.handleFileUpload(mockFile)).rejects.toThrow(
        'Upload failed',
      );
    });
  });

  describe('getFileStream', () => {
    it('should call getFileStream with file path', async () => {
      const filePath = 'bucket/document.pdf';
      const mockStream = new Readable();

      mockStorageProvider.getFileStream.mockResolvedValue(mockStream);

      const result = await service.getFileStream(filePath);

      expect(result).toBe(mockStream);
      expect(mockStorageProvider.getFileStream).toHaveBeenCalledWith(filePath);
    });

    it('should return stream from storage provider', async () => {
      const filePath = 'images/photo.jpg';
      const mockStream = new Readable();

      mockStorageProvider.getFileStream.mockResolvedValue(mockStream);

      const result = await service.getFileStream(filePath);

      expect(result).toBe(mockStream);
    });

    it('should propagate stream errors', async () => {
      const filePath = 'nonexistent/file.pdf';

      mockStorageProvider.getFileStream.mockRejectedValue(
        new Error('File not found'),
      );

      await expect(service.getFileStream(filePath)).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with storage provider', () => {
      expect(service).toBeDefined();
      expect((service as any).storageProvider).toBe(mockStorageProvider);
    });
  });
});
