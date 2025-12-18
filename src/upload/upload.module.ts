import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { MinioStorageProvider } from './storage/minio-storage.provider';
import { ConfigService } from '@nestjs/config';
import { createMinioClient } from './storage/minio.factory';

export const STORAGE_PROVIDER = 'StorageProvider';

@Module({
  providers: [
    UploadService,
    MinioStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const minioClient = createMinioClient(configService);
        return new MinioStorageProvider(minioClient, configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}











