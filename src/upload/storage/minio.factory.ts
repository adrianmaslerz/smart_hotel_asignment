import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export function createMinioClient(configService: ConfigService): Minio.Client {
  const endPoint = configService.get<string>('MINIO_HOST') ?? 'localhost';
  const port = configService.get<number>('MINIO_PORT') ?? 9000;
  const useSSL = configService.get<string>('MINIO_USE_SSL') === 'true';
  const accessKey = configService.get<string>('MINIO_ACCESS_KEY') ?? '';
  const secretKey = configService.get<string>('MINIO_SECRET_KEY') ?? '';

  return new Minio.Client({
    endPoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}
