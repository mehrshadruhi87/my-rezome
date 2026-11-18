import type {
  CategoryItem,
  CourseDetail,
  CourseLevel,
  CourseSummary,
  DiscountCodeItem,
  OrderRecord,
  OrderStatus,
  PlatformSettings,
  PublicUser,
  UserRole,
} from "../types";
import { generateSlug } from "../utils/formatters";
import {
  calculateCartTotals,
  validateDiscountEligibility,
} from "../utils/pricing";
import {
  DEFAULT_PLATFORM_SETTINGS,
  mergePlatformSettings,
} from "../utils/themeSettings";

export const DB_STORAGE_KEY = "codeacademy_db_v1";
export const AUTH_TOKEN_KEY = "codeacademy_auth_token";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

const fallbackMemoryStorage = createMemoryStorage();

export function getDefaultStorage(): StorageAdapter {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Fallback when localStorage is unavailable
  }
  return fallbackMemoryStorage;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string | null;
  bio: string | null;
  createdAt: string;
}

export interface DbLesson {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  isFree: boolean;
  position: number;
  summary: string;
  codeSnippet: string;
}

export interface DbChapter {
  id: string;
  title: string;
  position: number;
  lessons: DbLesson[];
}

export interface DbCourse {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  thumbnail: string;
  previewVideoUrl: string;
  price: number;
  discountPrice: number | null;
  level: CourseLevel;
  duration: string;
  prerequisites: string;
  language: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  isPublished: boolean;
  isFeatured: boolean;
  studentsCount: number;
  rating: number;
  categoryId: string;
  chapters: DbChapter[];
  createdAt: string;
  updatedAt: string;
}

export interface DbEnrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface DbOrderItem {
  id: string;
  courseId: string;
  price: number;
}

export interface DbOrder {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentRef: string | null;
  couponCode: string | null;
  items: DbOrderItem[];
  createdAt: string;
}

export interface DbReview {
  id: string;
  rating: number;
  comment: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  categories: CategoryItem[];
  courses: DbCourse[];
  enrollments: DbEnrollment[];
  orders: DbOrder[];
  reviews: DbReview[];
  discountCodes: DiscountCodeItem[];
  settings: PlatformSettings;
}

export function createId(prefix: string): string {
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
      return `${prefix}_${globalThis.crypto.randomUUID().slice(0, 12)}`;
    }
  } catch {
    // Fallback
  }
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-4);
  return `${prefix}_${ts}${rand}`;
}

export function hashPasswordSync(password: string): string {
  const input = `codeacademy_salt_2026:${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x85ebca6b);
  }
  return `ca_${(h1 >>> 0).toString(16)}_${(h2 >>> 0).toString(16)}`;
}

export function verifyPasswordSync(password: string, storedHash: string): boolean {
  return hashPasswordSync(password) === storedHash;
}

export function toPublicUser(user: DbUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export function signLocalToken(userId: string): string {
  return `local_tok_${userId}`;
}

export function parseLocalTokenUserId(token: string | null | undefined): string | null {
  if (!token) return null;
  const trimmed = token.replace(/^Bearer\s+/i, "").trim();
  if (!trimmed.startsWith("local_tok_")) return null;
  const userId = trimmed.slice("local_tok_".length).trim();
  return userId || null;
}

export const ADMIN_EMAIL = "mehrshadruhi87@gmail.com";
const ADMIN_PASSWORD_HASH = hashPasswordSync("mmnn8787");

export function authenticateAdminLogin(
  email: string,
  password: string,
  db: DatabaseSchema
): DbUser {
  const normalized = String(email).toLowerCase().trim();
  if (normalized !== ADMIN_EMAIL) {
    throw new LocalApiError(
      "دسترسی به پنل مدیریت فقط با ایمیل مجاز مدیر امکان‌پذیر است.",
      403
    );
  }
  if (hashPasswordSync(String(password)) !== ADMIN_PASSWORD_HASH) {
    throw new LocalApiError("رمز عبور مدیر سیستم اشتباه است.", 401);
  }

  let adminUser = db.users.find(
    (u) => u.email.toLowerCase() === ADMIN_EMAIL && u.role === "ADMIN"
  );
  if (!adminUser) {
    adminUser = {
      id: "usr_admin_1",
      name: "مهرشاد روحی",
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: "ADMIN",
      phone: "09102554874",
      bio: "مدیر سیستم و توسعه‌دهنده کدآکادمی",
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(adminUser);
  }
  return adminUser;
}

export function buildSeedData(): DatabaseSchema {
  const now = "2026-11-01T10:00:00.000Z";

  const adminUser: DbUser = {
    id: "usr_admin_1",
    name: "مهرشاد روحی",
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD_HASH,
    role: "ADMIN",
    phone: "09102554874",
    bio: "مدیر سیستم و توسعه‌دهنده کدآکادمی",
    createdAt: now,
  };

  const categories: CategoryItem[] = [
    {
      id: "cat_frontend",
      name: "توسعه فرانت‌اند",
      slug: "frontend",
      icon: "Layout",
      description: "React، Next.js، TypeScript و طراحی رابط کاربری مدرن",
    },
    {
      id: "cat_backend",
      name: "توسعه بک‌اند",
      slug: "backend",
      icon: "Server",
      description: "Node.js، NestJS، Go، Python Django و معماری میکروسرویس",
    },
    {
      id: "cat_ai",
      name: "هوش مصنوعی و دیتا",
      slug: "ai-data",
      icon: "BrainCircuit",
      description: "یادگیری ماشین، دیپ لرنینگ، LLM، پایتون و مهندسی داده",
    },
    {
      id: "cat_sec",
      name: "امنیت شبکه و هک قانونمند",
      slug: "cybersecurity",
      icon: "ShieldCheck",
      description: "تست نفوذ وب، امنیت شبکه، DevSecOps و تحلیل بدافزار",
    },
    {
      id: "cat_mobile",
      name: "برنامه‌نویسی موبایل",
      slug: "mobile",
      icon: "Smartphone",
      description: "Flutter، React Native، Kotlin و اپلیکیشن‌های کراس‌پلتفرم",
    },
    {
      id: "cat_devops",
      name: "دوآپس و کلود",
      slug: "devops",
      icon: "CloudCog",
      description: "Docker، Kubernetes، CI/CD، Linux و زیرساخت ابری",
    },
  ];

  const courses: DbCourse[] = [
    {
      id: "crs_nextjs_15",
      title: "بوت‌کمپ جامع Next.js 15، React 19 و معماری فول‌استک سازمانی",
      slug: "nextjs-15-fullstack-bootcamp",
      shortDesc:
        "آموزش پروژه‌محور ساخت اپلیکیشن‌های مقیاس‌پذیر با Next.js 15 App Router، Server Actions، Prisma و TypeScript.",
      description:
        "در این دوره فوق‌پیشرفته و کاملا پروژه‌محور، از مفاهیم پایه React 19 و رندرینگ سمت سرور (SSR/ISR) شروع کرده و تا پیاده‌سازی کامل یک پلتفرم فروشگاهی و SaaS با Next.js 15 پیش می‌رویم. تمامی مباحث امنیتی، احراز هویت، کشینگ پیشرفته و استقرار روی Docker پوشش داده شده است.",
      thumbnail: "/src/assets/images/course_nextjs_fullstack_1794952831549.jpg",
      previewVideoUrl: "",
      price: 4800000,
      discountPrice: 3450000,
      level: "ALL_LEVELS",
      duration: "۶۴ ساعت",
      prerequisites: "آشنایی با جاوااسکریپت و مبانی ری‌اکت",
      language: "فارسی",
      instructorName: "دکتر کیوان نادری",
      instructorTitle: "معمار ارشد فرانت‌اند",
      instructorBio:
        "بیش از ۱۱ سال تجربه تخصصی در مهندسی فرانت‌اند، مدرس بیش از ۲۰ هزار دانشجو در سراسر کشور.",
      isPublished: true,
      isFeatured: true,
      studentsCount: 1420,
      rating: 4.9,
      categoryId: "cat_frontend",
      createdAt: "2026-10-20T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_nx_1",
          title: "فصل اول: معماری مدرن وب و هسته Next.js 15",
          position: 1,
          lessons: [
            {
              id: "ls_nx_1",
              title: "معرفی دوره، نقشه راه و بررسی پروژه نهایی",
              duration: "۱۸:۲۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "آشنایی با ساختار App Router، استراتژی‌های رندرینگ و معماری فول‌استک در پروژه‌های واقعی.",
              codeSnippet: `export default async function CourseOverviewPage() {
  const courses = await getPublishedCourses();
  return <CatalogGrid items={courses} />;
}`,
            },
            {
              id: "ls_nx_2",
              title: "تفاوت عمیق Server Components و Client Components",
              duration: "۳۲:۱۰",
              videoUrl: "",
              isFree: true,
              position: 2,
              summary:
                "کاهش حجم باندل جاوااسکریپت با تفکیک مرزهای کلاینت و سرور و جریان استریمینگ Suspense.",
              codeSnippet: `"use client";
import { useOptimistic } from "react";

export function EnrollButton({ initialCount }: { initialCount: number }) {
  const [count, addOptimistic] = useOptimistic(initialCount, (s) => s + 1);
  return <button onClick={() => addOptimistic(1)}>{count} دانشجو</button>;
}`,
            },
            {
              id: "ls_nx_3",
              title: "معماری فولدرها، Dynamic Routes و Parallel Routes",
              duration: "۴۵:۰۰",
              videoUrl: "",
              isFree: false,
              position: 3,
              summary:
                "پیاده‌سازی روتینگ پیشرفته، Intercepting Routes برای مودال‌ها و مدیریت خطای لایه‌ای.",
              codeSnippet: `export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: \`دوره \${slug} | کدآکادمی\` };
}`,
            },
          ],
        },
        {
          id: "ch_nx_2",
          title: "فصل دوم: کار با پایگاه داده، Prisma ORM و Server Actions",
          position: 2,
          lessons: [
            {
              id: "ls_nx_4",
              title: "طراحی اسکیماهای رابطه‌ای پیچیده با Prisma و PostgreSQL",
              duration: "۳۸:۱۵",
              videoUrl: "",
              isFree: false,
              position: 1,
              summary:
                "مدل‌سازی روابط یک‌به‌چند و چندبه‌چند بین دوره‌ها، فصل‌ها، سفارش‌ها و دسترسی‌های کاربران.",
              codeSnippet: `model Enrollment {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  @@unique([userId, courseId])
}`,
            },
            {
              id: "ls_nx_5",
              title: "پیاده‌سازی Mutations امن با Server Actions و اعتبارسنجی",
              duration: "۵۰:۴۰",
              videoUrl: "",
              isFree: false,
              position: 2,
              summary:
                "اعتبارسنجی ورودی‌ها در سمت سرور، کنترل دسترسی RBAC و بازسازی هوشمند کش.",
              codeSnippet: `export async function createOrder(courseIds: string[]) {
  const session = await requireSession();
  return prisma.$transaction(async (tx) => {
    return tx.order.create({ data: { userId: session.id, status: "PENDING" } });
  });
}`,
            },
          ],
        },
        {
          id: "ch_nx_3",
          title: "فصل سوم: احراز هویت، درگاه پرداخت و دیپلوی پروداکشن",
          position: 3,
          lessons: [
            {
              id: "ls_nx_6",
              title: "پیاده‌سازی RBAC و اتصال به درگاه پرداخت",
              duration: "۵۵:۲۰",
              videoUrl: "",
              isFree: false,
              position: 1,
              summary:
                "مدیریت نشست امن، وریفای تراکنش‌های بانکی و فعال‌سازی آنی دوره‌ها پس از پرداخت موفق.",
              codeSnippet: `if (paymentVerified) {
  await grantEnrollments(order.userId, order.items);
}`,
            },
          ],
        },
      ],
    },
    {
      id: "crs_ai_llm",
      title: "متخصص هوش مصنوعی، پایتون، LLM و مهندسی ایجنت‌های هوشمند",
      slug: "python-ai-llm-engineering",
      shortDesc:
        "از مبانی پایتون و یادگیری ماشین تا ساخت سیستم‌های RAG، فاین‌تیون مدل‌های زبانی و ایجنت‌های خودکار.",
      description:
        "این بوت‌کمپ جامع شما را از سطح مقدماتی پایتون به یک مهندس هوش مصنوعی آماده ورود به بازار کار تبدیل می‌کند. کار با PyTorch، LangChain، پایگاه‌داده‌های برداری (Vector DB) و پیاده‌سازی دستیارهای هوشمند فارسی را به صورت عملی یاد می‌گیرید.",
      thumbnail: "/src/assets/images/course_ai_llm_1794952832798.jpg",
      previewVideoUrl: "",
      price: 5900000,
      discountPrice: 4200000,
      level: "ALL_LEVELS",
      duration: "۷۸ ساعت",
      prerequisites: "بدون پیش‌نیاز (شروع از صفر پایتون)",
      language: "فارسی",
      instructorName: "دکتر امیرحسین فرهادی",
      instructorTitle: "پژوهشگر ارشد هوش مصنوعی و NLP",
      instructorBio:
        "دکترای هوش مصنوعی و مشاور تیم‌های داده‌کاوی و پیاده‌سازی مدل‌های زبانی سازمانی.",
      isPublished: true,
      isFeatured: true,
      studentsCount: 1890,
      rating: 5.0,
      categoryId: "cat_ai",
      createdAt: "2026-10-18T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_ai_1",
          title: "فصل اول: پایتون پیشرفته برای علوم داده و هوش مصنوعی",
          position: 1,
          lessons: [
            {
              id: "ls_ai_1",
              title: "نقشه راه مهندسی AI و آماده‌سازی محیط Jupyter و CUDA",
              duration: "۲۲:۰۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "نصب ابزارهای علمی پایتون، مدیریت محیط‌های مجازی و پیکربندی شتاب‌دهنده گرافیکی.",
              codeSnippet: `import torch
print("GPU Available:", torch.cuda.is_available())`,
            },
            {
              id: "ls_ai_2",
              title: "پردازش ماتریسی سریع با NumPy و تحلیل داده با Pandas",
              duration: "۴۹:۳۰",
              videoUrl: "",
              isFree: true,
              position: 2,
              summary:
                "جبر خطی برداری، پاک‌سازی دیتاست‌های متنی فارسی و آماده‌سازی فیچرها.",
              codeSnippet: `import numpy as np
embeddings = np.random.randn(1024, 768)
norms = np.linalg.norm(embeddings, axis=1, keepdims=True)`,
            },
          ],
        },
        {
          id: "ch_ai_2",
          title: "فصل دوم: شبکه‌های عصبی عمیق و معماری Transformer",
          position: 2,
          lessons: [
            {
              id: "ls_ai_3",
              title: "کالبدشکافی مکانیزم Attention و مدل‌های زبانی بزرگ (LLM)",
              duration: "۶۴:۱۰",
              videoUrl: "",
              isFree: false,
              position: 1,
              summary:
                "درک عمیق Self-Attention، توکنایزرها و نحوه استنتاج مدل‌های زبانی.",
              codeSnippet: `scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
attn = torch.softmax(scores, dim=-1)`,
            },
          ],
        },
        {
          id: "ch_ai_3",
          title: "فصل سوم: مهندسی RAG، LangChain و ایجنت‌های سازمانی",
          position: 3,
          lessons: [
            {
              id: "ls_ai_4",
              title: "ساخت سیستم پرسش و پاسخ روی اسناد فارسی با Vector DB",
              duration: "۵۲:۴۵",
              videoUrl: "",
              isFree: false,
              position: 1,
              summary:
                "چانکینگ هوشمند متون فارسی، جستجوی معنایی هیبرید و ارزیابی پاسخ مدل.",
              codeSnippet: `retriever = vector_store.as_retriever(search_kwargs={"k": 4})
docs = retriever.invoke("سیاست مرجوعی سفارشات")`,
            },
          ],
        },
      ],
    },
    {
      id: "crs_nestjs_backend",
      title: "معماری میکروسرویس و بک‌اند مقیاس‌پذیر با Node.js، NestJS و RabbitMQ",
      slug: "nestjs-microservices-architecture",
      shortDesc:
        "طراحی سیستم‌های توزیع‌شده، Event-Driven Architecture، Redis، کلین آرکیتکچر و تست‌نویسی حرفه‌ای.",
      description:
        "اگر می‌خواهید از یک برنامه‌نویس معمولی بک‌اند به یک Senior Backend Engineer تبدیل شوید، این دوره دقیقا برای شما طراحی شده است. پیاده‌سازی سیستم بانکی و سفارش‌گیری با قابلیت تحمل میلیون‌ها درخواست.",
      thumbnail: "/src/assets/images/course_nestjs_backend_1794952832658.jpg",
      previewVideoUrl: "",
      price: 4200000,
      discountPrice: 2990000,
      level: "ADVANCED",
      duration: "۵۲ ساعت",
      prerequisites: "آشنایی با جاوااسکریپت/تایپ‌اسکریپت و مفاهیم پایه بک‌اند",
      language: "فارسی",
      instructorName: "مهندس پویا رستمی",
      instructorTitle: "لید فنی بک‌اند",
      instructorBio:
        "توسعه‌دهنده سیستم‌های پرترافیک فین‌تک و مدرس معماری نرم‌افزار.",
      isPublished: true,
      isFeatured: true,
      studentsCount: 940,
      rating: 4.8,
      categoryId: "cat_backend",
      createdAt: "2026-10-15T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_ns_1",
          title: "فصل اول: معماری تمیز (DDD & Clean Architecture) در NestJS",
          position: 1,
          lessons: [
            {
              id: "ls_ns_1",
              title: "چرا مونولیت‌ها شکست می‌خورند؟ ورود به دنیای میکروسرویس",
              duration: "۲۵:۱۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "مقایسه Bounded Contexts، الگوهای ارتباط سنکرون و آسنکرون و مدیریت خطا در سیستم‌های توزیع‌شده.",
              codeSnippet: `@EventPattern("order.completed")
async handleOrderCompleted(@Payload() event: OrderCompletedEvent) {
  await this.enrollmentService.activateCourse(event);
}`,
            },
            {
              id: "ls_ns_2",
              title: "پیاده‌سازی Dependency Injection و لایه‌بندی Domain",
              duration: "۴۴:۲۰",
              videoUrl: "",
              isFree: false,
              position: 2,
              summary:
                "جداسازی منطق دامنه از زیرساخت دیتابیس با الگوهای Repository و Unit of Work.",
              codeSnippet: `export interface OrderRepository {
  save(order: OrderAggregate): Promise<void>;
}`,
            },
          ],
        },
      ],
    },
    {
      id: "crs_cybersecurity",
      title: "متخصص تست نفوذ وب و باگ بانتی (OSWE & Bug Bounty Hunter)",
      slug: "web-penetration-testing-bug-bounty",
      shortDesc:
        "کشف آسیب‌پذیری‌های بحرانی وب، OWASP Top 10 پیشرفته، دور زدن WAF و کسب درآمد دلاری از باگ بانتی.",
      description:
        "آموزش صددرصد عملی هک قانونمند و امنیت وب‌اپلیکیشن‌ها روی آزمایشگاه‌های واقعی. از SQL Injection و XSS پیشرفته تا SSRF، Deserialization و تحلیل کد منبع.",
      thumbnail: "/src/assets/images/course_cybersecurity_1794952833875.jpg",
      previewVideoUrl: "",
      price: 5100000,
      discountPrice: 3800000,
      level: "INTERMEDIATE",
      duration: "۶۰ ساعت",
      prerequisites: "آشنایی مقدماتی با شبکه و پروتکل HTTP",
      language: "فارسی",
      instructorName: "مهندس سهراب کاظمی",
      instructorTitle: "محقق ارشد امنیت سایبری",
      instructorBio:
        "شکارچی باگ در پلتفرم‌های بین‌المللی با بیش از ۲۰۰ گزارش معتبر امنیتی.",
      isPublished: true,
      isFeatured: true,
      studentsCount: 1150,
      rating: 4.9,
      categoryId: "cat_sec",
      createdAt: "2026-10-12T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_sec_1",
          title: "فصل اول: متدولوژی Recon و شناسایی سطح حمله",
          position: 1,
          lessons: [
            {
              id: "ls_sec_1",
              title: "معرفی لابراتوار دوره و ابزارهای Burp Suite Pro",
              duration: "۲۹:۰۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "پیکربندی پروکسی رهگیری ترافیک، تحلیل هدرهای امنیتی و شناخت نقاط ورودی API.",
              codeSnippet: `curl -I https://target.example/api/v1/health -H "X-Forwarded-For: 127.0.0.1"`,
            },
            {
              id: "ls_sec_2",
              title: "اتوماسیون فرآیند Subdomain Enumeration و اسکن سرویس‌ها",
              duration: "۴۷:۱۵",
              videoUrl: "",
              isFree: false,
              position: 2,
              summary:
                "شناسایی زیرساخت‌های پنهان، بررسی فایل‌های JS و کشف Endpointهای فراموش‌شده.",
              codeSnippet: `subfinder -d example.com -silent | httpx -status-code -title`,
            },
          ],
        },
      ],
    },
    {
      id: "crs_devops_k8s",
      title: "آموزش جامع Docker، Kubernetes و مهندسی DevOps در پروداکشن",
      slug: "devops-docker-kubernetes-masterclass",
      shortDesc:
        "کانتینرسازی، ارکستریشن کلاسترهای کوبرنتیز، GitLab CI/CD، مانیتورینگ Prometheus و Grafana.",
      description:
        "صفر تا صد زیرساخت مدرن ابری و اتوماسیون استقرار نرم‌افزار. یاد بگیرید چگونه سرویس‌های بدون قطعی (Zero-Downtime) را روی سرورهای لینوکسی و کلود مدیریت کنید.",
      thumbnail: "/src/assets/images/course_devops_k8s_1794952834411.jpg",
      previewVideoUrl: "",
      price: 3900000,
      discountPrice: 2850000,
      level: "INTERMEDIATE",
      duration: "۴۶ ساعت",
      prerequisites: "آشنایی با دستورات پایه لینوکس",
      language: "فارسی",
      instructorName: "مهندس نیما شریفی",
      instructorTitle: "مهندس ارشد SRE و زیرساخت ابری",
      instructorBio:
        "مدیر زیرساخت ابری با تجربه مدیریت کلاسترهای بیش از ۲۰۰ نود.",
      isPublished: true,
      isFeatured: false,
      studentsCount: 780,
      rating: 4.8,
      categoryId: "cat_devops",
      createdAt: "2026-10-10T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_dev_1",
          title: "فصل اول: تسلط کامل بر Docker و بهینه‌سازی ایمیج‌ها",
          position: 1,
          lessons: [
            {
              id: "ls_dev_1",
              title: "معماری هسته لینوکس، Namespaces و Cgroups",
              duration: "۲۰:۳۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "درک سازوکار ایزوله‌سازی کانتینرها در هسته لینوکس و تفاوت آن با ماشین‌های مجازی.",
              codeSnippet: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev`,
            },
            {
              id: "ls_dev_2",
              title: "نوشتن Multi-stage Dockerfile استاندارد برای پروداکشن",
              duration: "۳۶:۰۰",
              videoUrl: "",
              isFree: false,
              position: 2,
              summary:
                "کاهش حجم ایمیج تا ۹۰٪، اجرای غیرروت و بررسی امنیت لایه‌ها.",
              codeSnippet: `docker buildx build --platform linux/amd64 -t academy-api:1.0 .`,
            },
          ],
        },
      ],
    },
    {
      id: "crs_algorithms_free",
      title: "مبانی الگوریتم، ساختمان داده و آمادگی مصاحبه شرکت‌های بزرگ",
      slug: "algorithms-data-structures-free",
      shortDesc:
        "دوره رایگان تقویت تفکر الگوریتمی، پیچیدگی زمانی Big-O، درخت‌ها، گراف‌ها و برنامه‌نویسی پویا.",
      description:
        "پایه و اساس هر برنامه‌نویس حرفه‌ای، درک عمیق ساختمان داده و الگوریتم است. این دوره به صورت کاملا رایگان برای ارتقای سطح علمی جامعه برنامه‌نویسان ایران منتشر شده است.",
      thumbnail: "/src/assets/images/course_algorithms_1794952833151.jpg",
      previewVideoUrl: "",
      price: 0,
      discountPrice: 0,
      level: "BEGINNER",
      duration: "۲۴ ساعت",
      prerequisites: "آشنایی اولیه با یک زبان برنامه‌نویسی",
      language: "فارسی",
      instructorName: "دکتر کیوان نادری",
      instructorTitle: "معمار ارشد نرم‌افزار",
      instructorBio: "مدرس دوره‌های مهندسی نرم‌افزار و الگوریتم.",
      isPublished: true,
      isFeatured: false,
      studentsCount: 3410,
      rating: 5.0,
      categoryId: "cat_backend",
      createdAt: "2026-10-08T09:00:00.000Z",
      updatedAt: now,
      chapters: [
        {
          id: "ch_alg_1",
          title: "فصل اول: تحلیل پیچیدگی زمانی و فضایی (Big-O)",
          position: 1,
          lessons: [
            {
              id: "ls_alg_1",
              title: "تحلیل کارایی الگوریتم‌ها و مقایسه ساختارهای حافظه",
              duration: "۳۱:۰۰",
              videoUrl: "",
              isFree: true,
              position: 1,
              summary:
                "محاسبه مرتبه زمانی O(1)، O(log n)، O(n) و بهینه‌سازی حلقه‌های تودرتو.",
              codeSnippet: `function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
            },
            {
              id: "ls_alg_2",
              title: "آرایه‌ها، لیست‌های پیوندی و تکنیک Two Pointers",
              duration: "۴۲:۱۰",
              videoUrl: "",
              isFree: true,
              position: 2,
              summary:
                "حل مسائل کلاسیک مصاحبه‌های فنی با الگوی دو اشاره‌گر و پنجره لغزان.",
              codeSnippet: `function twoSumSorted(nums: number[], target: number) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const sum = nums[l] + nums[r];
    if (sum === target) return [l, r];
    sum < target ? l++ : r--;
  }
  return null;
}`,
            },
          ],
        },
      ],
    },
  ];

  const discountCodes: DiscountCodeItem[] = [
    {
      id: "cpn_bahar30",
      code: "BAHAR30",
      type: "PERCENTAGE",
      value: 30,
      maxUses: 200,
      usedCount: 14,
      expiresAt: "2027-06-21T23:59:59.000Z",
      isActive: true,
      createdAt: now,
    },
    {
      id: "cpn_welcome500",
      code: "WELCOME500",
      type: "FIXED",
      value: 500000,
      maxUses: 100,
      usedCount: 8,
      expiresAt: "2027-06-21T23:59:59.000Z",
      isActive: true,
      createdAt: now,
    },
  ];

  const enrollments: DbEnrollment[] = [];

  const orders: DbOrder[] = [];

  const reviews: DbReview[] = [
    {
      id: "rev_seed_1",
      userId: "usr_guest_seed",
      courseId: courses[0].id,
      rating: 5,
      comment:
        "بهترین و عمیق‌ترین دوره Next.js به زبان فارسی! بخش Server Actions و معماری Prisma واقعا دید من رو به فول‌استک عوض کرد.",
      createdAt: now,
    },
    {
      id: "rev_seed_2",
      userId: adminUser.id,
      courseId: courses[1].id,
      rating: 5,
      comment:
        "پروژه‌های عملی بخش LLM و LangChain کاملا منطبق بر نیاز روز شرکت‌هاست.",
      createdAt: now,
    },
  ];

  return {
    users: [adminUser],
    categories,
    courses,
    enrollments,
    orders,
    reviews,
    discountCodes,
    settings: { ...DEFAULT_PLATFORM_SETTINGS },
  };
}

function migrateLegacyDemoUsers(db: DatabaseSchema): boolean {
  let changed = false;
  const legacyEmails = new Set(["admin@academy.ir", "student@academy.ir"]);

  const filtered = db.users.filter((u) => {
    const emailLower = u.email.toLowerCase();
    if (legacyEmails.has(emailLower)) {
      changed = true;
      return false;
    }
    if (u.role === "ADMIN" && emailLower !== ADMIN_EMAIL) {
      u.role = "STUDENT";
      changed = true;
    }
    return true;
  });

  if (!filtered.some((u) => u.email.toLowerCase() === ADMIN_EMAIL)) {
    filtered.unshift({
      id: "usr_admin_1",
      name: "مهرشاد روحی",
      email: ADMIN_EMAIL,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: "ADMIN",
      phone: "09102554874",
      bio: "مدیر سیستم و توسعه‌دهنده کدآکادمی",
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }

  if (changed) {
    db.users = filtered;
  }
  return changed;
}

export function readLocalDb(
  storage: StorageAdapter = getDefaultStorage()
): DatabaseSchema {
  try {
    const raw = storage.getItem(DB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (
        parsed &&
        Array.isArray(parsed.users) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.courses) &&
        Array.isArray(parsed.enrollments) &&
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.reviews) &&
        Array.isArray(parsed.discountCodes)
      ) {
        const db = parsed as DatabaseSchema;
        let needsSave = migrateLegacyDemoUsers(db);
        const normalizedSettings = mergePlatformSettings(db.settings);
        if (!db.settings) {
          db.settings = normalizedSettings;
          needsSave = true;
        } else {
          db.settings = normalizedSettings;
        }
        if (needsSave) {
          writeLocalDb(db, storage);
        }
        return db;
      }
    }
  } catch {
    // Re-seed if localStorage contains corrupted JSON
  }
  const seed = buildSeedData();
  writeLocalDb(seed, storage);
  return seed;
}

export function writeLocalDb(
  data: DatabaseSchema,
  storage: StorageAdapter = getDefaultStorage()
): void {
  storage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
}

function serializeCourseSummary(
  course: DbCourse,
  db: DatabaseSchema
): CourseSummary {
  const cat = db.categories.find((c) => c.id === course.categoryId);
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    shortDesc: course.shortDesc,
    thumbnail: course.thumbnail,
    price: course.price,
    discountPrice: course.discountPrice,
    level: course.level,
    duration: course.duration,
    instructorName: course.instructorName,
    instructorTitle: course.instructorTitle,
    studentsCount: course.studentsCount,
    rating: course.rating,
    isPublished: course.isPublished,
    isFeatured: course.isFeatured,
    categoryId: course.categoryId,
    category: cat
      ? { id: cat.id, name: cat.name, slug: cat.slug }
      : { id: course.categoryId, name: "برنامه‌نویسی", slug: "general" },
    createdAt: course.createdAt,
  };
}

export class LocalApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getAuthenticatedUser(
  db: DatabaseSchema,
  storage: StorageAdapter,
  headers?: Record<string, string>
): DbUser | null {
  const authHeader = headers?.Authorization ?? headers?.authorization;
  const token = authHeader || storage.getItem(AUTH_TOKEN_KEY);
  const userId = parseLocalTokenUserId(token);
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) ?? null;
}

function requireUser(
  db: DatabaseSchema,
  storage: StorageAdapter,
  headers?: Record<string, string>
): DbUser {
  const user = getAuthenticatedUser(db, storage, headers);
  if (!user) {
    throw new LocalApiError("برای ادامه ابتدا وارد حساب کاربری خود شوید.", 401);
  }
  return user;
}

function requireAdminUser(
  db: DatabaseSchema,
  storage: StorageAdapter,
  headers?: Record<string, string>
): DbUser {
  const user = requireUser(db, storage, headers);
  if (user.role !== "ADMIN" || user.email.toLowerCase() !== ADMIN_EMAIL) {
    throw new LocalApiError("دسترسی محدود به مدیر سیستم است.", 403);
  }
  return user;
}

function parseBody(body: BodyInit | null | undefined): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, any>;
    } catch {
      return {};
    }
  }
  return {};
}

export async function dispatchLocalApiRequest<T>(
  url: string,
  options: RequestInit = {},
  storage: StorageAdapter = getDefaultStorage()
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = (options.headers as Record<string, string>) || {};
  const body = parseBody(options.body);

  const [pathname, rawQuery = ""] = url.split("?");
  const params = new URLSearchParams(rawQuery);
  const db = readLocalDb(storage);

  // --- HEALTH ---
  if (method === "GET" && pathname === "/api/health") {
    return { ok: true } as T;
  }

  // --- BOOTSTRAP ---
  if (method === "GET" && pathname === "/api/bootstrap") {
    const user = getAuthenticatedUser(db, storage, headers);
    const categories = db.categories.map((cat) => ({
      ...cat,
      coursesCount: db.courses.filter(
        (c) => c.categoryId === cat.id && c.isPublished
      ).length,
    }));
    const enrolledCourseIds = user
      ? db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId)
      : [];
    return {
      categories,
      user: user ? toPublicUser(user) : null,
      enrolledCourseIds,
      settings: mergePlatformSettings(db.settings),
    } as T;
  }

  // --- AUTH ---
  if (method === "POST" && pathname === "/api/auth/login") {
    const { email, password } = body;
    if (!email || !password) {
      throw new LocalApiError("لطفاً ایمیل و رمز عبور را وارد کنید.", 400);
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    let user: DbUser;
    if (normalizedEmail === ADMIN_EMAIL) {
      user = authenticateAdminLogin(email, password, db);
      writeLocalDb(db, storage);
    } else {
      const found = db.users.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail && u.role === "STUDENT"
      );
      if (!found) {
        throw new LocalApiError(
          "کاربری با این ایمیل ثبت‌نام نکرده است. لطفاً ابتدا ثبت‌نام کنید.",
          401
        );
      }
      if (!verifyPasswordSync(String(password), found.passwordHash)) {
        throw new LocalApiError("رمز عبور اشتباه است.", 401);
      }
      user = found;
    }

    const token = signLocalToken(user.id);
    storage.setItem(AUTH_TOKEN_KEY, token);
    const enrolledCourseIds = db.enrollments
      .filter((e) => e.userId === user.id)
      .map((e) => e.courseId);
    return {
      user: toPublicUser(user),
      enrolledCourseIds,
      token,
    } as T;
  }

  if (method === "POST" && pathname === "/api/auth/register") {
    if (!mergePlatformSettings(db.settings).allowRegistration) {
      throw new LocalApiError(
        "ثبت‌نام کاربران جدید در حال حاضر توسط مدیریت متوقف شده است.",
        403
      );
    }
    const { name, email, password, phone } = body;
    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      String(password).length < 6
    ) {
      throw new LocalApiError(
        "نام، ایمیل معتبر و رمز عبور حداقل ۶ کاراکتری الزامی است.",
        400
      );
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (normalizedEmail === ADMIN_EMAIL) {
      throw new LocalApiError(
        "امکان ثبت‌نام با ایمیل اختصاصی مدیر سیستم وجود ندارد.",
        403
      );
    }
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new LocalApiError("این ایمیل قبلاً ثبت شده است.", 409);
    }
    const newUser: DbUser = {
      id: createId("usr"),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPasswordSync(String(password)),
      role: "STUDENT",
      phone: phone ? String(phone).trim() : null,
      bio: null,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeLocalDb(db, storage);
    const token = signLocalToken(newUser.id);
    storage.setItem(AUTH_TOKEN_KEY, token);
    return {
      user: toPublicUser(newUser),
      enrolledCourseIds: [],
      token,
    } as T;
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    storage.removeItem(AUTH_TOKEN_KEY);
    return { ok: true } as T;
  }

  if (method === "GET" && pathname === "/api/auth/me") {
    const user = getAuthenticatedUser(db, storage, headers);
    if (!user) {
      return { user: null, enrolledCourseIds: [] } as T;
    }
    const enrolledCourseIds = db.enrollments
      .filter((e) => e.userId === user.id)
      .map((e) => e.courseId);
    return { user: toPublicUser(user), enrolledCourseIds } as T;
  }

  if (method === "PUT" && pathname === "/api/profile") {
    const currentUser = requireUser(db, storage, headers);
    const { name, phone, bio } = body;
    if (!name?.trim()) {
      throw new LocalApiError("نام و نام خانوادگی نمی‌تواند خالی باشد.", 400);
    }
    const idx = db.users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) {
      throw new LocalApiError("کاربر یافت نشد.", 404);
    }
    db.users[idx] = {
      ...db.users[idx],
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : null,
      bio: bio ? String(bio).trim() : null,
    };
    writeLocalDb(db, storage);
    return { user: toPublicUser(db.users[idx]) } as T;
  }

  // --- COURSES PUBLIC ---
  if (method === "GET" && pathname === "/api/courses/search") {
    const q = (params.get("q") ?? "").trim().toLowerCase();
    if (q.length < 2) {
      return { courses: [] } as T;
    }
    const matches = db.courses
      .filter(
        (c) =>
          c.isPublished &&
          (c.title.toLowerCase().includes(q) ||
            c.shortDesc.toLowerCase().includes(q) ||
            c.instructorName.toLowerCase().includes(q))
      )
      .slice(0, 6)
      .map((c) => serializeCourseSummary(c, db));
    return { courses: matches } as T;
  }

  if (method === "GET" && pathname === "/api/courses") {
    const categorySlug = (params.get("category") ?? "").trim();
    const level = (params.get("level") ?? "").trim();
    const priceType = (params.get("price") ?? "").trim();
    const sort = (params.get("sort") ?? "newest").trim();
    const q = (params.get("q") ?? "").trim().toLowerCase();
    const featured = params.get("featured") === "true";
    const includeUnpublished = params.get("includeUnpublished") === "true";

    const user = getAuthenticatedUser(db, storage, headers);
    const canSeeUnpublished = includeUnpublished && user?.role === "ADMIN";

    let filtered = db.courses.filter((c) =>
      canSeeUnpublished ? true : c.isPublished
    );
    if (featured) {
      filtered = filtered.filter((c) => c.isFeatured);
    }
    if (categorySlug) {
      const cat = db.categories.find((catItem) => catItem.slug === categorySlug);
      filtered = cat ? filtered.filter((c) => c.categoryId === cat.id) : [];
    }
    if (level) {
      filtered = filtered.filter((c) => c.level === level);
    }
    if (priceType === "free") {
      filtered = filtered.filter((c) => (c.discountPrice ?? c.price) === 0);
    } else if (priceType === "paid") {
      filtered = filtered.filter((c) => (c.discountPrice ?? c.price) > 0);
    }
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDesc.toLowerCase().includes(q) ||
          c.instructorName.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (sort === "popular") return b.studentsCount - a.studentsCount;
      if (sort === "cheapest") {
        return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      courses: filtered.map((c) => serializeCourseSummary(c, db)),
    } as T;
  }

  // POST /api/courses/:id/reviews
  const reviewMatch = pathname.match(/^\/api\/courses\/([^/]+)\/reviews$/);
  if (method === "POST" && reviewMatch) {
    if (!mergePlatformSettings(db.settings).allowReviews) {
      throw new LocalApiError(
        "ثبت دیدگاه جدید در حال حاضر توسط مدیریت غیرفعال شده است.",
        403
      );
    }
    const courseId = decodeURIComponent(reviewMatch[1]);
    const currentUser = requireUser(db, storage, headers);
    const { rating, comment } = body;
    if (!comment || !String(comment).trim()) {
      throw new LocalApiError("متن دیدگاه نمی‌تواند خالی باشد.", 400);
    }
    const courseIdx = db.courses.findIndex((c) => c.id === courseId);
    if (courseIdx === -1) {
      throw new LocalApiError("دوره یافت نشد.", 404);
    }
    const numericRating = Math.min(5, Math.max(1, Number(rating) || 5));
    const review = {
      id: createId("rev"),
      courseId: db.courses[courseIdx].id,
      userId: currentUser.id,
      rating: numericRating,
      comment: String(comment).trim(),
      createdAt: new Date().toISOString(),
    };
    db.reviews.push(review);
    const courseReviews = db.reviews.filter(
      (r) => r.courseId === db.courses[courseIdx].id
    );
    const avg =
      courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length;
    db.courses[courseIdx].rating = Number(avg.toFixed(1));
    writeLocalDb(db, storage);
    return {
      review: { ...review, userName: currentUser.name },
      rating: db.courses[courseIdx].rating,
    } as T;
  }

  // GET /api/courses/:slug
  const courseDetailMatch = pathname.match(/^\/api\/courses\/([^/]+)$/);
  if (method === "GET" && courseDetailMatch) {
    const slugParam = decodeURIComponent(courseDetailMatch[1]);
    const user = getAuthenticatedUser(db, storage, headers);
    const course = db.courses.find(
      (c) => c.slug === slugParam || c.id === slugParam
    );
    if (!course || (!course.isPublished && user?.role !== "ADMIN")) {
      throw new LocalApiError("دوره مورد نظر یافت نشد.", 404);
    }

    const isEnrolled = user
      ? db.enrollments.some(
          (e) => e.userId === user.id && e.courseId === course.id
        ) || user.role === "ADMIN"
      : false;

    const reviews = db.reviews
      .filter((r) => r.courseId === course.id)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((r) => {
        const author = db.users.find((u) => u.id === r.userId);
        return {
          ...r,
          userName: author?.name ?? "کاربر کدآکادمی",
        };
      });

    const summary = serializeCourseSummary(course, db);
    const detail: CourseDetail = {
      ...summary,
      description: course.description,
      previewVideoUrl: course.previewVideoUrl,
      prerequisites: course.prerequisites,
      language: course.language,
      instructorBio: course.instructorBio,
      chapters: course.chapters.map((ch) => ({
        ...ch,
        lessons: ch.lessons.map((les) => ({
          ...les,
          codeSnippet: les.isFree || isEnrolled ? les.codeSnippet : "",
        })),
      })),
      reviews,
      isEnrolled,
    };

    return { course: detail } as T;
  }

  // --- COUPONS & CHECKOUT ---
  if (method === "POST" && pathname === "/api/coupons/validate") {
    if (!mergePlatformSettings(db.settings).allowCoupons) {
      throw new LocalApiError(
        "استفاده از کد تخفیف در حال حاضر توسط مدیریت غیرفعال شده است.",
        400
      );
    }
    const code = String(body?.code ?? "").trim().toUpperCase();
    if (!code) {
      throw new LocalApiError("لطفاً کد تخفیف را وارد کنید.", 400);
    }
    const discount = db.discountCodes.find((d) => d.code === code);
    const check = validateDiscountEligibility(discount);
    if (!check.valid || !discount) {
      throw new LocalApiError(
        check.valid ? "کد نامعتبر" : check.error,
        400
      );
    }
    return {
      coupon: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
      },
    } as T;
  }

  if (method === "POST" && pathname === "/api/checkout/initiate") {
    const currentUser = requireUser(db, storage, headers);
    const { courseIds, couponCode } = body;
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new LocalApiError("سبد خرید شما خالی است.", 400);
    }
    const selectedCourses = db.courses.filter((c) => courseIds.includes(c.id));
    if (selectedCourses.length === 0) {
      throw new LocalApiError("دوره‌های انتخاب شده یافت نشدند.", 404);
    }

    let appliedCoupon = null;
    if (couponCode) {
      const candidate = db.discountCodes.find(
        (d) => d.code === String(couponCode).trim().toUpperCase()
      );
      if (validateDiscountEligibility(candidate).valid && candidate) {
        appliedCoupon = {
          code: candidate.code,
          type: candidate.type,
          value: candidate.value,
        };
      }
    }

    const totals = calculateCartTotals(
      selectedCourses.map((c) => ({
        price: c.price,
        discountPrice: c.discountPrice,
      })),
      appliedCoupon
    );

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const order: DbOrder = {
      id: createId("ord"),
      orderNumber,
      userId: currentUser.id,
      totalAmount: totals.subtotal,
      discountAmount: totals.subtotal - totals.finalTotal,
      finalAmount: totals.finalTotal,
      status: "PENDING",
      paymentRef: null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      items: selectedCourses.map((c) => ({
        id: createId("ori"),
        courseId: c.id,
        price: c.discountPrice !== null ? c.discountPrice : c.price,
      })),
      createdAt: new Date().toISOString(),
    };

    db.orders.push(order);
    writeLocalDb(db, storage);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      finalAmount: order.finalAmount,
    } as T;
  }

  if (method === "POST" && pathname === "/api/checkout/verify") {
    const currentUser = requireUser(db, storage, headers);
    const { orderId, status } = body;
    const orderIdx = db.orders.findIndex(
      (o) => o.id === orderId && o.userId === currentUser.id
    );
    if (orderIdx === -1) {
      throw new LocalApiError("سفارش یافت نشد.", 404);
    }

    const order = db.orders[orderIdx];
    if (order.status === "COMPLETED") {
      return {
        success: true,
        orderNumber: order.orderNumber,
        paymentRef: order.paymentRef,
      } as T;
    }

    if (status === "FAILED") {
      db.orders[orderIdx].status = "FAILED";
      writeLocalDb(db, storage);
      return { success: false, orderNumber: order.orderNumber } as T;
    }

    const paymentRef = `ZP-${Math.floor(10000000 + Math.random() * 90000000)}`;
    db.orders[orderIdx].status = "COMPLETED";
    db.orders[orderIdx].paymentRef = paymentRef;

    if (order.couponCode) {
      const cIdx = db.discountCodes.findIndex(
        (d) => d.code === order.couponCode
      );
      if (cIdx !== -1) {
        db.discountCodes[cIdx].usedCount += 1;
      }
    }

    const newlyEnrolledCourseIds: string[] = [];
    for (const item of order.items) {
      const exists = db.enrollments.some(
        (e) => e.userId === order.userId && e.courseId === item.courseId
      );
      if (!exists) {
        db.enrollments.push({
          id: createId("enr"),
          userId: order.userId,
          courseId: item.courseId,
          createdAt: new Date().toISOString(),
        });
        const crsIdx = db.courses.findIndex((c) => c.id === item.courseId);
        if (crsIdx !== -1) {
          db.courses[crsIdx].studentsCount += 1;
        }
      }
      newlyEnrolledCourseIds.push(item.courseId);
    }

    writeLocalDb(db, storage);
    return {
      success: true,
      orderNumber: order.orderNumber,
      paymentRef,
      enrolledCourseIds: newlyEnrolledCourseIds,
    } as T;
  }

  // --- STUDENT DASHBOARD ---
  if (method === "GET" && pathname === "/api/student/dashboard") {
    const currentUser = requireUser(db, storage, headers);
    const enrolledIds = db.enrollments
      .filter((e) => e.userId === currentUser.id)
      .map((e) => e.courseId);

    const enrolledCourses = db.courses
      .filter((c) => enrolledIds.includes(c.id))
      .map((c) => ({
        ...serializeCourseSummary(c, db),
        chaptersCount: c.chapters.length,
        lessonsCount: c.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0),
      }));

    const orders: OrderRecord[] = db.orders
      .filter((o) => o.userId === currentUser.id)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((o) => ({
        ...o,
        items: o.items.map((item) => {
          const c = db.courses.find((crs) => crs.id === item.courseId);
          return {
            ...item,
            courseTitle: c?.title ?? "دوره آموزشی",
            courseSlug: c?.slug ?? "",
            courseThumbnail: c?.thumbnail ?? "",
          };
        }),
      }));

    return {
      user: toPublicUser(currentUser),
      enrolledCourses,
      orders,
    } as T;
  }

  // --- ADMIN OVERVIEW ---
  if (method === "GET" && pathname === "/api/admin/overview") {
    requireAdminUser(db, storage, headers);
    const completedOrders = db.orders.filter((o) => o.status === "COMPLETED");
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + o.finalAmount,
      0
    );
    const totalStudents = db.users.filter((u) => u.role === "STUDENT").length;
    const publishedCourses = db.courses.filter((c) => c.isPublished).length;
    const totalEnrollments = db.enrollments.length;

    const recentOrders: OrderRecord[] = [...db.orders]
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20)
      .map((o) => {
        const u = db.users.find((usr) => usr.id === o.userId);
        return {
          ...o,
          userName: u?.name ?? "کاربر",
          userEmail: u?.email ?? "",
          items: o.items.map((item) => {
            const c = db.courses.find((crs) => crs.id === item.courseId);
            return {
              ...item,
              courseTitle: c?.title ?? "دوره",
              courseSlug: c?.slug ?? "",
              courseThumbnail: c?.thumbnail ?? "",
            };
          }),
        };
      });

    return {
      stats: {
        totalRevenue,
        totalStudents,
        publishedCourses,
        totalCourses: db.courses.length,
        completedOrdersCount: completedOrders.length,
        totalEnrollments,
      },
      recentOrders,
    } as T;
  }

  // --- ADMIN COURSES ---
  if (method === "POST" && pathname === "/api/admin/courses") {
    requireAdminUser(db, storage, headers);
    if (!body.title?.trim() || !body.categoryId) {
      throw new LocalApiError("عنوان دوره و دسته‌بندی الزامی است.", 400);
    }
    const baseSlug = generateSlug(body.slug?.trim() || body.title);
    const uniqueSlug = db.courses.some((c) => c.slug === baseSlug)
      ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
      : baseSlug;

    const now = new Date().toISOString();
    const newCourse: DbCourse = {
      id: createId("crs"),
      title: String(body.title).trim(),
      slug: uniqueSlug || createId("course"),
      shortDesc: String(body.shortDesc ?? "").trim(),
      description: String(body.description ?? "").trim(),
      thumbnail:
        String(body.thumbnail ?? "").trim() ||
        "/src/assets/images/course_nextjs_fullstack_1794952831549.jpg",
      previewVideoUrl: String(body.previewVideoUrl ?? "").trim(),
      price: Math.max(0, Number(body.price) || 0),
      discountPrice:
        body.discountPrice !== null &&
        body.discountPrice !== "" &&
        Number(body.discountPrice) >= 0
          ? Number(body.discountPrice)
          : null,
      level: body.level || "ALL_LEVELS",
      duration: String(body.duration || "۲۰ ساعت").trim(),
      prerequisites: String(
        body.prerequisites || "آشنایی مقدماتی با کامپیوتر"
      ).trim(),
      language: "فارسی",
      instructorName: String(body.instructorName || "مدرس کدآکادمی").trim(),
      instructorTitle: String(
        body.instructorTitle || "مهندس ارشد نرم‌افزار"
      ).trim(),
      instructorBio: String(
        body.instructorBio ||
          "مدرس و معمار سیستم‌های نرم‌افزاری با تجربه پروژه‌های مقیاس‌پذیر."
      ).trim(),
      isPublished: Boolean(body.isPublished ?? true),
      isFeatured: Boolean(body.isFeatured ?? false),
      studentsCount: 0,
      rating: 5.0,
      categoryId: String(body.categoryId),
      chapters: Array.isArray(body.chapters)
        ? body.chapters.map((ch: any, cIdx: number) => ({
            id: ch.id || createId("ch"),
            title: String(ch.title || `فصل ${cIdx + 1}`).trim(),
            position: cIdx + 1,
            lessons: Array.isArray(ch.lessons)
              ? ch.lessons.map((les: any, lIdx: number) => ({
                  id: les.id || createId("ls"),
                  title: String(les.title || `درس ${lIdx + 1}`).trim(),
                  duration: String(les.duration || "۱۵:۰۰").trim(),
                  videoUrl: String(les.videoUrl || "").trim(),
                  isFree: Boolean(les.isFree),
                  position: lIdx + 1,
                  summary: String(
                    les.summary || "آموزش عملی و بررسی کدهای استاندارد تولید."
                  ).trim(),
                  codeSnippet: String(les.codeSnippet || "").trim(),
                }))
              : [],
          }))
        : [],
      createdAt: now,
      updatedAt: now,
    };

    db.courses.unshift(newCourse);
    writeLocalDb(db, storage);
    return { course: serializeCourseSummary(newCourse, db) } as T;
  }

  const adminCourseDupMatch = pathname.match(
    /^\/api\/admin\/courses\/([^/]+)\/duplicate$/
  );
  if (method === "POST" && adminCourseDupMatch) {
    requireAdminUser(db, storage, headers);
    const id = decodeURIComponent(adminCourseDupMatch[1]);
    const existing = db.courses.find((c) => c.id === id);
    if (!existing) {
      throw new LocalApiError("دوره مورد نظر یافت نشد.", 404);
    }
    const now = new Date().toISOString();
    const copy: DbCourse = {
      ...existing,
      id: createId("crs"),
      title: `${existing.title} (کپی)`,
      slug: `${existing.slug}-copy-${Date.now().toString().slice(-4)}`,
      isPublished: false,
      isFeatured: false,
      studentsCount: 0,
      chapters: existing.chapters.map((ch) => ({
        ...ch,
        id: createId("ch"),
        lessons: ch.lessons.map((l) => ({ ...l, id: createId("ls") })),
      })),
      createdAt: now,
      updatedAt: now,
    };
    db.courses.unshift(copy);
    writeLocalDb(db, storage);
    return { course: serializeCourseSummary(copy, db) } as T;
  }

  const adminCourseMatch = pathname.match(/^\/api\/admin\/courses\/([^/]+)$/);
  if (adminCourseMatch) {
    requireAdminUser(db, storage, headers);
    const id = decodeURIComponent(adminCourseMatch[1]);

    if (method === "GET") {
      const course = db.courses.find((c) => c.id === id);
      if (!course) throw new LocalApiError("دوره یافت نشد.", 404);
      return { course } as T;
    }

    if (method === "PUT") {
      const idx = db.courses.findIndex((c) => c.id === id);
      if (idx === -1) throw new LocalApiError("دوره یافت نشد.", 404);
      const existing = db.courses[idx];
      const cleanSlug = body.slug?.trim()
        ? generateSlug(body.slug)
        : existing.slug;
      db.courses[idx] = {
        ...existing,
        title: body.title ? String(body.title).trim() : existing.title,
        slug: cleanSlug || existing.slug,
        shortDesc:
          body.shortDesc !== undefined
            ? String(body.shortDesc).trim()
            : existing.shortDesc,
        description:
          body.description !== undefined
            ? String(body.description).trim()
            : existing.description,
        thumbnail: body.thumbnail
          ? String(body.thumbnail).trim()
          : existing.thumbnail,
        previewVideoUrl:
          body.previewVideoUrl !== undefined
            ? String(body.previewVideoUrl).trim()
            : existing.previewVideoUrl,
        price:
          body.price !== undefined
            ? Math.max(0, Number(body.price) || 0)
            : existing.price,
        discountPrice:
          body.discountPrice !== undefined
            ? body.discountPrice !== null &&
              body.discountPrice !== "" &&
              Number(body.discountPrice) >= 0
              ? Number(body.discountPrice)
              : null
            : existing.discountPrice,
        level: body.level || existing.level,
        duration: body.duration ? String(body.duration).trim() : existing.duration,
        prerequisites:
          body.prerequisites !== undefined
            ? String(body.prerequisites).trim()
            : existing.prerequisites,
        instructorName: body.instructorName
          ? String(body.instructorName).trim()
          : existing.instructorName,
        instructorTitle: body.instructorTitle
          ? String(body.instructorTitle).trim()
          : existing.instructorTitle,
        categoryId: body.categoryId || existing.categoryId,
        isPublished:
          body.isPublished !== undefined
            ? Boolean(body.isPublished)
            : existing.isPublished,
        isFeatured:
          body.isFeatured !== undefined
            ? Boolean(body.isFeatured)
            : existing.isFeatured,
        chapters: Array.isArray(body.chapters)
          ? body.chapters.map((ch: any, cIdx: number) => ({
              id: ch.id || createId("ch"),
              title: String(ch.title || `فصل ${cIdx + 1}`).trim(),
              position: cIdx + 1,
              lessons: Array.isArray(ch.lessons)
                ? ch.lessons.map((les: any, lIdx: number) => ({
                    id: les.id || createId("ls"),
                    title: String(les.title || `درس ${lIdx + 1}`).trim(),
                    duration: String(les.duration || "۱۵:۰۰").trim(),
                    videoUrl: String(les.videoUrl || "").trim(),
                    isFree: Boolean(les.isFree),
                    position: lIdx + 1,
                    summary: String(
                      les.summary || "آموزش عملی و بررسی کدهای استاندارد تولید."
                    ).trim(),
                    codeSnippet: String(les.codeSnippet || "").trim(),
                  }))
                : [],
            }))
          : existing.chapters,
        updatedAt: new Date().toISOString(),
      };
      writeLocalDb(db, storage);
      return { course: serializeCourseSummary(db.courses[idx], db) } as T;
    }

    if (method === "DELETE") {
      db.courses = db.courses.filter((c) => c.id !== id);
      db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
      db.reviews = db.reviews.filter((r) => r.courseId !== id);
      writeLocalDb(db, storage);
      return { ok: true } as T;
    }
  }

  // --- ADMIN CATEGORIES ---
  if (method === "POST" && pathname === "/api/admin/categories") {
    requireAdminUser(db, storage, headers);
    const { name, slug, icon, description } = body;
    if (!name?.trim()) {
      throw new LocalApiError("نام دسته‌بندی الزامی است.", 400);
    }
    const cleanSlug = generateSlug(slug?.trim() || name) || createId("cat");
    if (db.categories.some((c) => c.slug === cleanSlug)) {
      throw new LocalApiError("اسلاگ این دسته‌بندی تکراری است.", 409);
    }
    const cat: CategoryItem = {
      id: createId("cat"),
      name: String(name).trim(),
      slug: cleanSlug,
      icon: String(icon || "Code2"),
      description: description ? String(description).trim() : null,
    };
    db.categories.push(cat);
    writeLocalDb(db, storage);
    return { category: cat } as T;
  }

  const adminCatMatch = pathname.match(/^\/api\/admin\/categories\/([^/]+)$/);
  if (adminCatMatch) {
    requireAdminUser(db, storage, headers);
    const id = decodeURIComponent(adminCatMatch[1]);
    if (method === "PUT") {
      const { name, slug, icon, description } = body;
      const idx = db.categories.findIndex((c) => c.id === id);
      if (idx === -1) throw new LocalApiError("دسته‌بندی یافت نشد.", 404);
      db.categories[idx] = {
        ...db.categories[idx],
        name: name ? String(name).trim() : db.categories[idx].name,
        slug: slug ? generateSlug(slug) : db.categories[idx].slug,
        icon: icon ? String(icon) : db.categories[idx].icon,
        description:
          description !== undefined
            ? String(description).trim()
            : db.categories[idx].description,
      };
      writeLocalDb(db, storage);
      return { category: db.categories[idx] } as T;
    }
    if (method === "DELETE") {
      db.categories = db.categories.filter((c) => c.id !== id);
      writeLocalDb(db, storage);
      return { ok: true } as T;
    }
  }

  // --- ADMIN COUPONS ---
  if (method === "GET" && pathname === "/api/admin/coupons") {
    requireAdminUser(db, storage, headers);
    return { coupons: db.discountCodes } as T;
  }

  if (method === "POST" && pathname === "/api/admin/coupons") {
    requireAdminUser(db, storage, headers);
    const { code, type, value, maxUses, expiresAt } = body;
    const cleanCode = String(code ?? "").trim().toUpperCase();
    if (!cleanCode || Number(value) <= 0) {
      throw new LocalApiError("کد تخفیف و مقدار معتبر الزامی است.", 400);
    }
    if (db.discountCodes.some((d) => d.code === cleanCode)) {
      throw new LocalApiError("این کد تخفیف قبلاً ثبت شده است.", 409);
    }
    const coupon: DiscountCodeItem = {
      id: createId("cpn"),
      code: cleanCode,
      type: type === "FIXED" ? "FIXED" : "PERCENTAGE",
      value: Number(value),
      maxUses: Math.max(1, Number(maxUses) || 100),
      usedCount: 0,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.discountCodes.unshift(coupon);
    writeLocalDb(db, storage);
    return { coupon } as T;
  }

  const adminCouponMatch = pathname.match(/^\/api\/admin\/coupons\/([^/]+)$/);
  if (adminCouponMatch) {
    requireAdminUser(db, storage, headers);
    const id = decodeURIComponent(adminCouponMatch[1]);
    if (method === "PATCH") {
      const idx = db.discountCodes.findIndex((d) => d.id === id);
      if (idx === -1) throw new LocalApiError("کد تخفیف یافت نشد.", 404);
      db.discountCodes[idx].isActive = Boolean(body?.isActive);
      writeLocalDb(db, storage);
      return { coupon: db.discountCodes[idx] } as T;
    }
    if (method === "DELETE") {
      db.discountCodes = db.discountCodes.filter((d) => d.id !== id);
      writeLocalDb(db, storage);
      return { ok: true } as T;
    }
  }

  // --- ADMIN USERS & ENROLLMENTS ---
  if (method === "GET" && pathname === "/api/admin/users") {
    requireAdminUser(db, storage, headers);
    const users = db.users.map((u) => ({
      ...toPublicUser(u),
      enrolledCourseIds: db.enrollments
        .filter((e) => e.userId === u.id)
        .map((e) => e.courseId),
      ordersCount: db.orders.filter((o) => o.userId === u.id).length,
    }));
    return { users } as T;
  }

  const adminUserRoleMatch = pathname.match(
    /^\/api\/admin\/users\/([^/]+)\/role$/
  );
  if (method === "PATCH" && adminUserRoleMatch) {
    requireAdminUser(db, storage, headers);
    const id = decodeURIComponent(adminUserRoleMatch[1]);
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new LocalApiError("کاربر یافت نشد.", 404);
    if (db.users[idx].email.toLowerCase() === ADMIN_EMAIL) {
      throw new LocalApiError("نقش مدیر اصلی سیستم قابل تغییر نیست.", 403);
    }
    if (body?.role === "ADMIN") {
      throw new LocalApiError(
        "دسترسی مدیر فقط برای ایمیل اختصاصی مدیر مجاز است.",
        403
      );
    }
    db.users[idx].role = "STUDENT";
    writeLocalDb(db, storage);
    return { user: toPublicUser(db.users[idx]) } as T;
  }

  if (method === "POST" && pathname === "/api/admin/enrollments") {
    requireAdminUser(db, storage, headers);
    const { userId, courseId } = body;
    const exists = db.enrollments.some(
      (e) => e.userId === userId && e.courseId === courseId
    );
    if (exists) {
      throw new LocalApiError("این دانشجو قبلاً در این دوره ثبت‌نام شده است.", 409);
    }
    const crsIdx = db.courses.findIndex((c) => c.id === courseId);
    if (crsIdx === -1) throw new LocalApiError("دوره یافت نشد.", 404);
    db.enrollments.push({
      id: createId("enr"),
      userId: String(userId),
      courseId: String(courseId),
      createdAt: new Date().toISOString(),
    });
    db.courses[crsIdx].studentsCount += 1;
    writeLocalDb(db, storage);
    return { ok: true } as T;
  }

  // --- PLATFORM SETTINGS ---
  if (method === "GET" && pathname === "/api/settings") {
    return { settings: mergePlatformSettings(db.settings) } as T;
  }

  if (method === "PUT" && pathname === "/api/admin/settings") {
    requireAdminUser(db, storage, headers);
    const merged = mergePlatformSettings({
      ...mergePlatformSettings(db.settings),
      ...(body ?? {}),
    });
    db.settings = merged;
    writeLocalDb(db, storage);
    return { settings: merged } as T;
  }

  if (method === "POST" && pathname === "/api/admin/settings/reset") {
    requireAdminUser(db, storage, headers);
    db.settings = { ...DEFAULT_PLATFORM_SETTINGS };
    writeLocalDb(db, storage);
    return { settings: db.settings } as T;
  }

  throw new LocalApiError(`مسیر درخواستی یافت نشد: ${method} ${pathname}`, 404);
}
