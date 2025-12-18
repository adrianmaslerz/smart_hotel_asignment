import {UploadResult} from "../upload-result.interface";

export interface StorageProvider {
  uploadFile(
    file: Express.Multer.File,
    objectName: string,
  ): Promise<UploadResult>;
}
