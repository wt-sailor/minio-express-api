import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { MinioService } from "../minio/minio.service";
import { DEFAULT_BUCKET, API_ENDPOINT, getProtocol } from "../common/constants";
import { UploadFilesDto } from "./dto/upload-files.dto";
import { ReplaceFileDto } from "./dto/replace-file.dto";
import { DeleteFilesDto } from "./dto/delete-files.dto";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly minioService: MinioService) {}

  /**
   * Helper to generate a public URL for a file in MinIO storage
   */
  private getFileUrl(bucket: string, filename: string): string {
    const protocol = getProtocol();
    return `${protocol}://${API_ENDPOINT}/storage/${bucket}/${filename}`;
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    uploadFilesDto: UploadFilesDto,
    metadata?: any
  ) {
    const bucket = uploadFilesDto.bucket || DEFAULT_BUCKET;
    const folder = uploadFilesDto.folder || "";
    const randomName = uploadFilesDto.randomName !== "false";

    await this.minioService.ensureBucketExists(bucket);

    const uploadedFiles: Array<{
      originalName: string;
      name: string;
      url: string;
      size: number;
      time: string;
    }> = [];

    const minioClient = this.minioService.getClient();

    for (const file of files) {
      const originalName = file.originalname;
      const uploadTime = new Date().toISOString();

      let filename: string;
      if (randomName) {
        const timestamp = Date.now();
        const ext = originalName.substring(originalName.lastIndexOf("."));
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf("."));
        filename = `${timestamp}_${nameWithoutExt}${ext}`;
      } else {
        filename = originalName;
      }

      const objectName = folder ? `${folder}/${filename}` : filename;

      try {
        await minioClient.putObject(bucket, objectName, file.buffer, file.size);
      } catch (err: any) {
        this.logger.error(`Error uploading file ${originalName} to ${bucket}/${objectName}:`, err);
        throw new InternalServerErrorException(`Failed to upload ${originalName}: ${err.message}`);
      }

      uploadedFiles.push({
        originalName,
        name: filename,
        url: this.getFileUrl(bucket, objectName),
        size: file.size,
        time: uploadTime,
      });
    }

    const response: any = {
      message: metadata
        ? `Only first ${metadata.uploaded} files uploaded due to max upload limit of ${metadata.uploaded}`
        : "Files uploaded successfully",
      files: uploadedFiles,
    };

    if (metadata) {
      response.warning = `${metadata.discarded} file(s) exceeded the limit and were not uploaded`;
      response.totalReceived = metadata.totalReceived;
      response.uploaded = metadata.uploaded;
      response.discarded = metadata.discarded;
    }

    return response;
  }

  /**
   * Replace an existing file
   */
  async replaceFile(file: Express.Multer.File, replaceFileDto: ReplaceFileDto) {
    const bucket = replaceFileDto.bucket || DEFAULT_BUCKET;
    const folder = replaceFileDto.folder || "";
    const name = replaceFileDto.name;

    await this.minioService.ensureBucketExists(bucket);

    const objectName = folder ? `${folder}/${name}` : name;
    const minioClient = this.minioService.getClient();

    try {
      await minioClient.putObject(bucket, objectName, file.buffer, file.size);
      return {
        message: "File replaced successfully",
        url: this.getFileUrl(bucket, objectName),
      };
    } catch (err: any) {
      this.logger.error(`Error replacing file ${objectName} in ${bucket}:`, err);
      throw new InternalServerErrorException(`Failed to replace file: ${err.message}`);
    }
  }

  /**
   * List files within a bucket
   */
  async listFiles(bucketName?: string, folderName?: string) {
    const bucket = bucketName || DEFAULT_BUCKET;
    const folder = folderName || "";

    await this.minioService.ensureBucketExists(bucket);

    const minioClient = this.minioService.getClient();
    const objects: any[] = [];

    return new Promise((resolve, reject) => {
      try {
        const stream = minioClient.listObjectsV2(bucket, folder, true);

        stream.on("data", (obj: any) => {
          objects.push({
            name: obj.name,
            url: this.getFileUrl(bucket, obj.name),
            size: obj.size,
            time: obj.lastModified,
          });
        });

        stream.on("end", () => {
          resolve({
            count: objects.length,
            files: objects,
          });
        });

        stream.on("error", (err: Error) => {
          this.logger.error(`Error in object stream for bucket ${bucket}:`, err);
          reject(new InternalServerErrorException(`Failed to list files: ${err.message}`));
        });
      } catch (err: any) {
        this.logger.error(`Error listing files in bucket ${bucket}:`, err);
        reject(new InternalServerErrorException(`Failed to list files: ${err.message}`));
      }
    });
  }

  /**
   * Retrieve file stream proxy
   */
  async getFileProxy(bucket: string, name: string) {
    const minioClient = this.minioService.getClient();

    try {
      const stream = await minioClient.getObject(bucket, name);
      return stream;
    } catch (err: any) {
      this.logger.error(`Error fetching object ${name} from bucket ${bucket}:`, err);
      throw new NotFoundException(`File not found: ${err.message}`);
    }
  }

  /**
   * Batch delete files
   */
  async deleteFiles(deleteFilesDto: DeleteFilesDto) {
    const bucket = deleteFilesDto.bucket || DEFAULT_BUCKET;
    const folder = deleteFilesDto.folder || "";
    const names = deleteFilesDto.names;

    await this.minioService.ensureBucketExists(bucket);

    const deleted: string[] = [];
    const errors: Array<{ name: string; error: string }> = [];
    const minioClient = this.minioService.getClient();

    for (const name of names) {
      const objectName = folder ? `${folder}/${name}` : name;

      try {
        await minioClient.removeObject(bucket, objectName);
        deleted.push(objectName);
      } catch (err: any) {
        this.logger.error(`Error removing object ${objectName} from bucket ${bucket}:`, err);
        errors.push({ name: objectName, error: err.message });
      }
    }

    return {
      message: "Delete operation completed",
      deleted,
      errors,
    };
  }
}
