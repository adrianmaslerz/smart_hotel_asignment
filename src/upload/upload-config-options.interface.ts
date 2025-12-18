import { MimeType } from './mime-type.enum';

export interface UploadConfigOptions {
  allowedMimeTypes?: MimeType[];
  maxFileSize?: number;
}

