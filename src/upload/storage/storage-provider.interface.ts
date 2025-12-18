import { UploadResult } from "../upload-result.interface";

export abstract class StorageProvider {
  abstract uploadFile(
    file: Express.Multer.File,
    objectName: string,
  ): Promise<UploadResult>;
}
