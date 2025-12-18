import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { UploadConfigOptions } from './upload-config-options.interface';
import { AVAILABLE_MIME_TYPES, DEFAULT_MAX_FILE_SIZE } from './upload.config';
import { MimeType } from './mime-type.enum';

export function createUploadConfig(
  options: UploadConfigOptions = {},
): MulterOptions {
  const allowedMimeTypes =
    options.allowedMimeTypes ?? Object.values(AVAILABLE_MIME_TYPES);
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

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
