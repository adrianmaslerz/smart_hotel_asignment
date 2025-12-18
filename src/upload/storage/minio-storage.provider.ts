import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';
import { StorageProvider } from './storage-provider.interface';
import type { UploadResult } from '../upload-result.interface';

@Injectable()
export class MinioStorageProvider implements StorageProvider {
  private bucketName: string;

  constructor(
    private minioClient: Minio.Client,
    private configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') ?? 'smart-hotel';
  }

  async uploadFile(
    file: Express.Multer.File,
    objectName: string,
  ): Promise<UploadResult> {
    const stream = Readable.from(file.buffer);
    const fileSize = file.size ?? 0;

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      stream,
      fileSize,
      { 'Content-Type': file.mimetype },
    );

    return {
      filename: file.originalname,
      objectName,
      size: fileSize,
      mimetype: file.mimetype,
      bucket: this.bucketName,
    };
  }
}
