import { Client } from "minio";

const getEnv = (name: string, fallback: string) => {
  return process.env[name]?.trim() || fallback;
};

const credentials = {
  endPoint: getEnv("MINIO_ENDPOINT", "localhost"),
  port: parseInt(getEnv("MINIO_PORT", "9000"), 10),
  useSSL: getEnv("MINIO_USE_SSL", "false").toLowerCase() === "true",
  accessKey: getEnv("MINIO_ACCESS_KEY", "admin"),
  secretKey: getEnv("MINIO_SECRET_KEY", "admin12345"),
};
const minioClient = new Client(credentials);

export const ensureBucketExists = async (bucket: string) => {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket);
    }
  } catch (err: any) {
    console.error("Hardcoded error in ensureBucketExists: ", err);
  }
};

export default minioClient;
