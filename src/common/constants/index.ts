export const MAX_UPLOAD_FILES = parseInt(process.env.MAX_UPLOAD_FILES || "20", 10);
export const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "1024", 10);
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MULTER_MAX_FILES = 100;

export const DEFAULT_BUCKET = process.env.BUCKET_NAME || "testing";

export const API_ENDPOINT = process.env.API_ENDPOINT || "bucket.umangsailor.com";

export const getProtocol = (): string => {
  return API_ENDPOINT.includes("localhost:") || API_ENDPOINT.includes("192.168.1.")
    ? "http"
    : "https";
};
