import { Controller, Get, Res, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { MinioService } from "../minio/minio.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly minioService: MinioService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  @ApiOperation({
    summary: "Health check endpoint",
    description: "Returns the health status of the API and all connected services (MinIO)",
  })
  @ApiResponse({
    status: 200,
    description: "All services are healthy",
  })
  @ApiResponse({
    status: 503,
    description: "One or more services are down/degraded",
  })
  async getHealth(@Res() res: Response) {
    const endPoint = this.configService.get<string>("minio.endPoint", "localhost");
    const port = this.configService.get<number>("minio.port", 9000);
    const useSSL = this.configService.get<boolean>("minio.useSSL", false);

    const healthStatus: any = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: "up",
          message: "API is running",
        },
        minio: {
          status: "down",
          message: "Not checked",
        },
      },
    };

    try {
      // listBuckets to verify minio client connectivity
      await this.minioService.getClient().listBuckets();

      healthStatus.services.minio = {
        status: "up",
        message: "MinIO connection successful",
        endpoint: `${useSSL ? "https" : "http"}://${endPoint}:${port}`,
      };
    } catch (err: any) {
      healthStatus.status = "degraded";
      healthStatus.services.minio = {
        status: "down",
        message: `MinIO connection failed: ${err.message}`,
        endpoint: `${useSSL ? "https" : "http"}://${endPoint}:${port}`,
      };
    }

    if (healthStatus.services.minio.status === "down") {
      healthStatus.status = "degraded";
      healthStatus.message = "MinIO service is down";
    } else {
      healthStatus.message = "All services are operational";
    }

    const httpStatus =
      healthStatus.status === "healthy"
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json(healthStatus);
  }
}
