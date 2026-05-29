import { Request, Response } from "express";
import minioClient from "../config/minio";
import { DEFAULT_BUCKET } from "../constants";

/**
 * Health check endpoint
 * Checks connectivity to MinIO and returns detailed status
 */
export const healthCheck = async (req: Request, res: Response) => {
    const healthStatus: {
        status: "healthy" | "degraded" | "unhealthy";
        timestamp: string;
        services: {
            api: {
                status: "up";
                message: string;
            };
            minio: {
                status: "up" | "down";
                message: string;
                endpoint?: string;
            };
        };
        message?: string;
    } = {
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

    // Check MinIO connectivity
    try {
        const endpoint = process.env.MINIO_ENDPOINT?.trim() || "localhost";
        const port = process.env.MINIO_PORT?.trim() || "9000";
        const useSSL = (process.env.MINIO_USE_SSL?.trim().toLowerCase() || "false") === "true";

        // Try to list buckets to verify connection
        await minioClient.listBuckets();

        healthStatus.services.minio = {
            status: "up",
            message: "MinIO connection successful",
            endpoint: `${useSSL ? "https" : "http"}://${endpoint}:${port}`,
        };
    } catch (err: any) {
        healthStatus.status = "degraded";
        healthStatus.services.minio = {
            status: "down",
            message: `MinIO connection failed: ${err.message}`,
            endpoint: `${(process.env.MINIO_USE_SSL?.trim().toLowerCase() || "false") === "true" ? "https" : "http"}://${process.env.MINIO_ENDPOINT?.trim() || "localhost"}:${process.env.MINIO_PORT?.trim() || "9000"}`,
        };
    }

    // Determine overall status
    if (healthStatus.services.minio.status === "down") {
        healthStatus.status = "degraded";
        healthStatus.message = "MinIO service is down";
    } else {
        healthStatus.message = "All services are operational";
    }

    // Return appropriate HTTP status code
    const httpStatus = healthStatus.status === "healthy" ? 200 : 503;

    res.status(httpStatus).json(healthStatus);
};
