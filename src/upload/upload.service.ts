import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage/storage-provider.interface';

@Injectable()
export class UploadService {
  constructor(private storageProvider: StorageProvider) {}

  async handleFileUpload(file: Express.Multer.File) {
    const objectName = `${Date.now()}-${file.originalname}`;
    return this.storageProvider.uploadFile(file, objectName);
  }
}
