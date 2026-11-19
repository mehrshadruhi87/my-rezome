import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "نام و نام خانوادگی حداقل باید ۲ کاراکتر باشد."),
  email: z.string().trim().email("فرمت ایمیل معتبر نیست."),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد."),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور الزامی است."),
});

export const verifyRequestSchema = z.object({
  channel: z.enum(["email", "phone"]).default("email"),
});

export const verifyConfirmSchema = z.object({
  channel: z.enum(["email", "phone"]).default("email"),
  code: z.string().trim().length(6, "کد تایید باید ۶ رقمی باشد."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست."),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست."),
  code: z.string().trim().min(6, "کد بازیابی معتبر نیست."),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است."),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد."),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "نام و نام خانوادگی نمی‌تواند کمتر از ۲ کاراکتر باشد."),
  phone: z.string().trim().max(20).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  avatarUrl: z.string().trim().nullable().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته‌بندی الزامی است."),
  slug: z.string().trim().optional(),
  icon: z.string().trim().default("Code2"),
  description: z.string().trim().nullable().optional(),
});

const lessonInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "عنوان جلسه الزامی است."),
  duration: z.string().trim().default("۱۵:۰۰"),
  videoUrl: z.string().trim().default(""),
  isFree: z.boolean().default(false),
  position: z.number().int().min(1).optional(),
  summary: z.string().trim().optional(),
  codeSnippet: z.string().optional(),
});

const chapterInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "عنوان فصل الزامی است."),
  position: z.number().int().min(1).optional(),
  lessons: z.array(lessonInputSchema).default([]),
});

export const courseCreateSchema = z.object({
  title: z.string().trim().min(3, "عنوان دوره حداقل باید ۳ کاراکتر باشد."),
  slug: z.string().trim().optional(),
  shortDesc: z.string().trim().default(""),
  description: z.string().trim().default(""),
  thumbnail: z
    .string()
    .trim()
    .default("/src/assets/images/course_nextjs_fullstack_1794952831549.jpg"),
  previewVideoUrl: z.string().trim().default(""),
  price: z.coerce.number().int().min(0).default(0),
  discountPrice: z.coerce.number().int().min(0).nullable().optional(),
  level: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"])
    .default("ALL_LEVELS"),
  duration: z.string().trim().default("۲۰ ساعت"),
  prerequisites: z.string().trim().default("آشنایی مقدماتی با کامپیوتر"),
  language: z.string().trim().default("فارسی"),
  instructorId: z.string().nullable().optional(),
  instructorName: z.string().trim().default("مدرس کدآکادمی"),
  instructorTitle: z.string().trim().default("مهندس ارشد نرم‌افزار"),
  instructorBio: z.string().trim().default(""),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.string().min(1, "انتخاب دسته‌بندی الزامی است."),
  chapters: z.array(chapterInputSchema).default([]),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const coursePublishSchema = z.object({
  isPublished: z.boolean(),
});

export const chapterSchema = z.object({
  title: z.string().trim().min(2, "عنوان فصل الزامی است."),
  position: z.coerce.number().int().min(1).optional(),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2, "عنوان جلسه الزامی است."),
  duration: z.string().trim().default("۱۵:۰۰"),
  videoUrl: z.string().trim().default(""),
  isFree: z.boolean().default(false),
  position: z.coerce.number().int().min(1).optional(),
  summary: z.string().trim().default(""),
  codeSnippet: z.string().default(""),
});

export const lessonAttachmentSchema = z.object({
  title: z.string().trim().min(2, "عنوان فایل ضمیمه الزامی است."),
  fileUrl: z.string().trim().url("آدرس فایل معتبر نیست."),
  fileType: z.string().trim().default("application/pdf"),
  fileSize: z.coerce.number().int().min(0).default(0),
});

export const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "متن دیدگاه حداقل باید ۳ کاراکتر باشد."),
});

export const reviewModerateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "لطفاً کد تخفیف را وارد کنید."),
});

export const couponCreateSchema = z.object({
  code: z.string().trim().min(2, "کد تخفیف الزامی است."),
  type: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  value: z.coerce.number().int().min(1, "مقدار تخفیف باید مثبت باشد."),
  maxUses: z.coerce.number().int().min(1).default(100),
  expiresAt: z.string().nullable().optional(),
});

export const couponToggleSchema = z.object({
  isActive: z.boolean(),
});

export const checkoutInitiateSchema = z.object({
  courseIds: z
    .array(z.string().min(1))
    .min(1, "حداقل یک دوره باید انتخاب شود."),
  couponCode: z.string().trim().nullable().optional(),
});

export const checkoutVerifySchema = z.object({
  orderId: z.string().min(1, "شناسه سفارش الزامی است."),
  authority: z.string().trim().optional(),
  status: z.enum(["SUCCESS", "FAILED", "OK", "NOK"]).optional(),
});

export const manualEnrollmentSchema = z.object({
  userId: z.string().min(1, "شناسه کاربر الزامی است."),
  courseId: z.string().min(1, "شناسه دوره الزامی است."),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().trim().min(2, "عنوان اعلان الزامی است."),
  message: z.string().trim().min(3, "متن اعلان الزامی است."),
  type: z.enum(["SYSTEM", "ORDER", "COURSE", "REVIEW", "AUTH"]).default("SYSTEM"),
  link: z.string().trim().nullable().optional(),
  targetRole: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]).optional(),
});
