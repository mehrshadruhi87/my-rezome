import crypto from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env";
import { BadRequestError } from "../utils/errors";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB serverless-safe limit
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestError(
          `فرمت فایل (${file.mimetype}) مجاز نیست. فرمت‌های مجاز: تصویر، ویدئو MP4/WebM، PDF و ZIP.`
        )
      );
      return;
    }
    cb(null, true);
  },
});

export interface UploadedFileResult {
  url: string;
  provider: "cloudinary" | "s3" | "dev-inline";
  mimeType: string;
  size: number;
  originalName: string;
}

function hasCloudinaryConfig(): boolean {
  return Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
  );
}

function hasS3Config(): boolean {
  return Boolean(env.s3Bucket && env.s3AccessKeyId && env.s3SecretAccessKey);
}

async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string
): Promise<UploadedFileResult> {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });

  const resourceType = file.mimetype.startsWith("video/")
    ? "video"
    : file.mimetype.startsWith("image/")
    ? "image"
    : "raw";

  const secureUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `codeacademy/${folder}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

  return {
    url: secureUrl,
    provider: "cloudinary",
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname,
  };
}

async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<UploadedFileResult> {
  const client = new S3Client({
    region: env.s3Region,
    ...(env.s3Endpoint ? { endpoint: env.s3Endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: env.s3AccessKeyId,
      secretAccessKey: env.s3SecretAccessKey,
    },
  });

  const ext = path.extname(file.originalname) || "";
  const key = `codeacademy/${folder}/${Date.now()}-${crypto
    .randomBytes(6)
    .toString("hex")}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const baseUrl = env.s3PublicBaseUrl
    ? env.s3PublicBaseUrl.replace(/\/+$/, "")
    : env.s3Endpoint
    ? `${env.s3Endpoint.replace(/\/+$/, "")}/${env.s3Bucket}`
    : `https://${env.s3Bucket}.s3.${env.s3Region}.amazonaws.com`;

  return {
    url: `${baseUrl}/${key}`,
    provider: "s3",
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname,
  };
}

export async function uploadFileToCloud(
  file: Express.Multer.File,
  folder = "general"
): Promise<UploadedFileResult> {
  if (env.storageProvider === "s3" && hasS3Config()) {
    return uploadToS3(file, folder);
  }
  if (hasCloudinaryConfig()) {
    return uploadToCloudinary(file, folder);
  }
  if (hasS3Config()) {
    return uploadToS3(file, folder);
  }

  if (env.isProduction) {
    throw new BadRequestError(
      "پیکربندی فضای ذخیره‌سازی ابری (Cloudinary یا S3) در متغیرهای محیطی تنظیم نشده است."
    );
  }

  // In local non-production dev without cloud credentials, return a safe base64 data URI for images <= 2MB
  if (file.size <= 2 * 1024 * 1024) {
    const base64 = file.buffer.toString("base64");
    return {
      url: `data:${file.mimetype};base64,${base64}`,
      provider: "dev-inline",
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    };
  }

  throw new BadRequestError(
    "برای آپلود فایل‌های بالای ۲ مگابایت، کلیدهای Cloudinary یا S3 را در .env تنظیم کنید."
  );
}
