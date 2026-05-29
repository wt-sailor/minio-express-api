import { registerAs } from "@nestjs/config";

const getEnv = (name: string, fallback: string): string => {
  return process.env[name]?.trim() || fallback;
};

export default registerAs("minio", () => ({
  endPoint: getEnv("MINIO_ENDPOINT", "localhost"),
  port: parseInt(getEnv("MINIO_PORT", "9000"), 10),
  useSSL: getEnv("MINIO_USE_SSL", "false").toLowerCase() === "true",
  accessKey: getEnv("MINIO_ACCESS_KEY", "admin"),
  secretKey: getEnv("MINIO_SECRET_KEY", "admin12345"),
}));
