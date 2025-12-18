import { Injectable, Inject } from '@nestjs/common';
import type { StorageProvider } from './storage/storage-provider.interface';
import { STORAGE_PROVIDER } from './upload.module';

@Injectable()
export class UploadService {
  constructor(@Inject(STORAGE_PROVIDER) private storageProvider: StorageProvider) {}

  async handleFileUpload(file: Express.Multer.File) {
    const objectName = `${Date.now()}-${file.originalname}`;
    return this.storageProvider.uploadFile(file, objectName);
  }
}













