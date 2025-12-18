import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MimeType } from './mime-type.enum';
import { UploadConfigOptions } from './upload-config-options.interface';

export const AVAILABLE_MIME_TYPES = {
  xlsx: MimeType.XLSX,
};

const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function createUploadConfig(
  options: UploadConfigOptions = {},
): MulterOptions {
  const allowedMimeTypes =
    options.allowedMimeTypes || Object.values(AVAILABLE_MIME_TYPES);
  const maxFileSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE;

  return {
    fileFilter: (req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype as MimeType)) {
        return callback(
          new BadRequestException(
            `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
      }

      callback(null, true);
    },
    limits: {
      fileSize: maxFileSize,
    },
  };
}
