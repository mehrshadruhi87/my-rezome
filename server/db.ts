import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type {
  CategoryItem,
  CourseLevel,
  DiscountCodeItem,
  OrderStatus,
  UserRole,
} from "../src/types";

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
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "codeacademy-db.json");

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
}

function buildSeedData(): DatabaseSchema {
  const now = new Date("2026-11-01T10:00:00.000Z").toISOString();
  const adminPassword = bcrypt.hashSync("Admin1234!", 10);
  const studentPassword = bcrypt.hashSync("Student1234!", 10);

  const adminUser: DbUser = {
    id: "usr_admin_1",
    name: "مهندس آرش رادمنش",
    email: "admin@academy.ir",
    passwordHash: adminPassword,
    role: "ADMIN",
    phone: "09121112233",
    bio: "معمار ارشد نرم‌افزار و بنیان‌گذار کدآکادمی",
    createdAt: now,
  };

  const studentUser: DbUser = {
    id: "usr_student_1",
    name: "سارا محمدی",
    email: "student@academy.ir",
    passwordHash: studentPassword,
    role: "STUDENT",
    phone: "09123334455",
    bio: "توسعه‌دهنده فرانت‌اند و علاقه‌مند به هوش مصنوعی",
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

  const enrollments: DbEnrollment[] = [
    {
      id: "enr_seed_1",
      userId: studentUser.id,
      courseId: courses[0].id,
      createdAt: now,
    },
  ];

  const orders: DbOrder[] = [
    {
      id: "ord_seed_1",
      orderNumber: "ORD-140401",
      userId: studentUser.id,
      totalAmount: 4800000,
      discountAmount: 1350000,
      finalAmount: 3450000,
      status: "COMPLETED",
      paymentRef: "ZP-98451203",
      couponCode: null,
      items: [
        {
          id: "ori_seed_1",
          courseId: courses[0].id,
          price: 3450000,
        },
      ],
      createdAt: now,
    },
  ];

  const reviews: DbReview[] = [
    {
      id: "rev_seed_1",
      userId: studentUser.id,
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
    users: [adminUser, studentUser],
    categories,
    courses,
    enrollments,
    orders,
    reviews,
    discountCodes,
  };
}

let cachedDb: DatabaseSchema | null = null;

export function readDb(): DatabaseSchema {
  if (cachedDb) return cachedDb;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = buildSeedData();
    writeDb(seed);
    cachedDb = seed;
    return seed;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  cachedDb = JSON.parse(raw) as DatabaseSchema;
  return cachedDb;
}

export function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, DB_PATH);
  cachedDb = data;
}
