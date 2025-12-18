import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AVAILABLE_MIME_TYPES } from './upload.config';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Walidacja mime type
    const allowedMimes = Object.values(AVAILABLE_MIME_TYPES);
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${Object.keys(AVAILABLE_MIME_TYPES).join(', ')}`,
      );
    }

    return {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}







