import { S3Client } from "@aws-sdk/client-s3";

// 对象存储配置
export const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || "ai-content-hub";
