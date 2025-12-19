import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { MinioStorageProvider } from './storage/minio-storage.provider';
import { ConfigService } from '@nestjs/config';
import { createMinioClient } from './storage/minio.factory';
import { StorageProvider } from './storage/storage-provider.interface';

@Module({
  providers: [
    {
      provide: StorageProvider,
      useFactory: (configService: ConfigService) => {
        const minioClient = createMinioClient(configService);
        return new MinioStorageProvider(minioClient, configService);
      },
      inject: [ConfigService],
    },
    UploadService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
