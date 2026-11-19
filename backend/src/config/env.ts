import dotenv from "dotenv";

const isServerlessHost =
  Boolean(process.env.NETLIFY) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const dotenvResult = isServerlessHost ? { parsed: undefined } : dotenv.config();
const preserveHostKeys = new Set([
  "PORT",
  "NODE_ENV",
  "APP_URL",
  "SHARED_APP_URL",
  "NETLIFY",
  "AWS_LAMBDA_FUNCTION_NAME",
  "DISABLE_HMR",
]);
if (dotenvResult.parsed) {
  for (const [key, value] of Object.entries(dotenvResult.parsed)) {
    if (!preserveHostKeys.has(key) && value) {
      process.env[key] = value;
    }
  }
}

const rawOrigins =
  process.env.CORS_ALLOWED_ORIGINS ||
  "https://codeacademy-ir.netlify.app,http://localhost:3000,http://localhost:8888";

const isServerless =
  Boolean(process.env.NETLIFY) ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isServerless,
  isProduction: process.env.NODE_ENV === "production" || isServerless,
  port: Number(process.env.PORT) || 3000,
  appUrl: process.env.APP_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "https://codeacademy-ir.netlify.app",
  corsOrigins: Array.from(
    new Set(
      [
        ...rawOrigins
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        process.env.APP_URL?.trim() || "",
        process.env.SHARED_APP_URL?.trim() || "",
        process.env.URL?.trim() || "",
        process.env.DEPLOY_PRIME_URL?.trim() || "",
      ].filter(Boolean)
    )
  ),
  databaseUrl: process.env.DATABASE_URL?.trim() || "",

  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET ||
    process.env.SESSION_SECRET ||
    "codeacademy-dev-access-secret-change-in-prod-32chars",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    process.env.SESSION_SECRET ||
    "codeacademy-dev-refresh-secret-change-in-prod-32chars",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS) || 30,

  adminEmail: (
    process.env.ADMIN_EMAIL || "mehrshadruhi87@gmail.com"
  ).toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "mmnn8787",

  storageProvider: (process.env.STORAGE_PROVIDER || "cloudinary").toLowerCase(),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY?.trim() || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || "",

  s3Endpoint: process.env.S3_ENDPOINT?.trim() || "",
  s3Region: process.env.S3_REGION?.trim() || "us-east-1",
  s3Bucket: process.env.S3_BUCKET?.trim() || "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID?.trim() || "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY?.trim() || "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.trim() || "",

  zarinpalMerchantId:
    process.env.ZARINPAL_MERCHANT_ID?.trim() ||
    "00000000-0000-0000-0000-000000000000",
  zarinpalSandbox: process.env.ZARINPAL_SANDBOX !== "false",
  zarinpalCallbackUrl:
    process.env.ZARINPAL_CALLBACK_URL?.trim() ||
    "http://localhost:3000/api/payments/zarinpal/callback",

  smtpHost: process.env.SMTP_HOST?.trim() || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER?.trim() || "",
  smtpPass: process.env.SMTP_PASS?.trim() || "",
  smtpFrom: process.env.SMTP_FROM || "CodeAcademy <no-reply@codeacademy.ir>",
};
