import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Client;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const endPoint = this.configService.get<string>("minio.endPoint", "localhost");
    const port = this.configService.get<number>("minio.port", 9000);
    const useSSL = this.configService.get<boolean>("minio.useSSL", false);
    const accessKey = this.configService.get<string>("minio.accessKey", "admin");
    const secretKey = this.configService.get<string>("minio.secretKey", "admin12345");

    this.client = new Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
    this.logger.log("MinIO client initialized successfully");
  }

  getClient(): Client {
    return this.client;
  }

  async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) {
        await this.client.makeBucket(bucket);
        this.logger.log(`Created bucket: ${bucket}`);
      }
    } catch (err: any) {
      this.logger.error(`Error in ensureBucketExists for bucket ${bucket}:`, err);
    }
  }
}
