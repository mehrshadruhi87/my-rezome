import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/env";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "CodeAcademy Serverless REST API",
    version: "2.0.0",
    description:
      "مستندات کامل API بک‌اند آموزشی کدآکادمی (Netlify Functions + Express + TypeScript + PostgreSQL/Prisma + Zarinpal)",
    contact: {
      name: "Mehrshad Ruhi",
      email: "mehrshadruhi87@gmail.com",
    },
  },
  servers: [
    { url: "/api", description: "Same-Origin API Proxy" },
    { url: `${env.frontendUrl}/api`, description: "Production (Netlify)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "ca_access_token",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object", nullable: true },
          error: {
            type: "object",
            nullable: true,
            properties: {
              code: { type: "string" },
              details: {},
            },
          },
        },
      },
    },
  },
  tags: [
    { name: "System", description: "سلامت سرویس، بوت‌استرپ و تنظیمات" },
    { name: "Auth", description: "ثبت‌نام، ورود، Refresh Token، بازیابی رمز و نشست‌ها" },
    { name: "Users", description: "پروفایل کاربری و مدیریت کاربران (Admin)" },
    { name: "Categories", description: "دسته‌بندی‌های آموزشی" },
    { name: "Courses", description: "دوره‌ها، فصل‌ها، جلسات و فایل‌های ضمیمه" },
    { name: "Enrollments", description: "ثبت‌نام و دسترسی دانشجویان" },
    { name: "Checkout & Zarinpal", description: "کد تخفیف، ثبت سفارش و تایید سرور-به-سرور زرین‌پال" },
    { name: "Reviews", description: "امتیازدهی، دیدگاه‌ها و تایید/رد نظرات" },
    { name: "Notifications", description: "اعلان‌های کاربران و ارسال همگانی" },
    { name: "Uploads & Analytics", description: "آپلود ابری فایل (Cloudinary/S3) و آمار پنل مدیریت/مدرس" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "بررسی سلامت سرویس و دیتابیس",
        responses: { 200: { description: "سرویس سالم است" } },
      },
    },
    "/bootstrap": {
      get: {
        tags: ["System"],
        summary: "دریافت داده‌های اولیه سایت (تنظیمات، دسته‌بندی‌ها، کاربر جاری)",
        responses: { 200: { description: "موفق" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "ثبت‌نام کاربر جدید",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  phone: { type: "string" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: { 201: { description: "کاربر ساخته شد و کوکی HttpOnly ست شد" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "ورود و دریافت Access & Refresh Token در کوکی HttpOnly",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "ورود موفق" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "تمدید Access Token با چرخش Refresh Token",
        responses: { 200: { description: "تمدید موفق" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "خروج و ابطال نشست جاری",
        responses: { 200: { description: "خروج موفق" } },
      },
    },
    "/auth/password/forgot": {
      post: {
        tags: ["Auth"],
        summary: "درخواست کد بازیابی رمز عبور",
        responses: { 200: { description: "ارسال کد بازیابی" } },
      },
    },
    "/auth/password/reset": {
      post: {
        tags: ["Auth"],
        summary: "بازنشانی رمز عبور با کد بازیابی",
        responses: { 200: { description: "رمز عبور تغییر کرد" } },
      },
    },
    "/auth/password/change": {
      patch: {
        tags: ["Auth"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "تغییر رمز عبور کاربر لاگین‌شده",
        responses: { 200: { description: "تغییر موفق" } },
      },
    },
    "/auth/sessions": {
      get: {
        tags: ["Auth"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "لیست نشست‌های فعال کاربر",
        responses: { 200: { description: "لیست نشست‌ها" } },
      },
    },
    "/courses": {
      get: {
        tags: ["Courses"],
        summary: "لیست دوره‌ها با فیلتر، جستجو، مرتب‌سازی و صفحه‌بندی",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "level", in: "query", schema: { type: "string" } },
          { name: "price", in: "query", schema: { type: "string", enum: ["free", "paid"] } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "popular", "cheapest", "highest_rated"] } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { 200: { description: "لیست دوره‌ها + meta صفحه‌بندی" } },
      },
    },
    "/courses/{slug}": {
      get: {
        tags: ["Courses"],
        summary: "دریافت جزئیات دوره و سرفصل‌ها (محافظت محتوای پولی)",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "جزئیات دوره" } },
      },
    },
    "/checkout/initiate": {
      post: {
        tags: ["Checkout & Zarinpal"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "ثبت سفارش با محاسبه قیمت روی سرور و ایجاد لینک پرداخت زرین‌پال",
        responses: { 201: { description: "سفارش و لینک درگاه ساخته شد" } },
      },
    },
    "/payments/zarinpal/callback": {
      get: {
        tags: ["Checkout & Zarinpal"],
        summary: "کال‌بک درگاه زرین‌پال و استعلام سرور-به-سرور Verify",
        responses: { 302: { description: "هدایت به صفحه نتیجه پرداخت" } },
      },
    },
    "/checkout/verify": {
      post: {
        tags: ["Checkout & Zarinpal"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "تایید سفارش رایگان یا استعلام Authority زرین‌پال",
        responses: { 200: { description: "نتیجه تایید سفارش" } },
      },
    },
    "/courses/{id}/reviews": {
      post: {
        tags: ["Reviews"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "ثبت دیدگاه و امتیاز ۱ تا ۵ برای دوره",
        responses: { 201: { description: "دیدگاه ثبت شد" } },
      },
    },
    "/admin/reviews/{id}/moderate": {
      patch: {
        tags: ["Reviews"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "تایید یا رد دیدگاه توسط مدیر",
        responses: { 200: { description: "وضعیت دیدگاه تغییر یافت" } },
      },
    },
    "/uploads": {
      post: {
        tags: ["Uploads & Analytics"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "آپلود فایل با Multer (memoryStorage) به Cloudinary یا S3",
        responses: { 201: { description: "لینک فایل آپلودشده" } },
      },
    },
    "/admin/overview": {
      get: {
        tags: ["Uploads & Analytics"],
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        summary: "آمار کامل پنل مدیریت (درآمد کل، درآمد ماهانه، کاربران، آخرین سفارش‌ها)",
        responses: { 200: { description: "آمار داشبورد مدیریت" } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});

export function renderSwaggerHtml(specUrl = "/api/docs.json"): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeAcademy API Docs (Swagger)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body{margin:0;background:#f8fafc;} .swagger-ui .topbar{background:#0f172a;}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>`;
}
