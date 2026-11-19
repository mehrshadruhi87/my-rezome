import fs from "node:fs";
import path from "node:path";
import type {
  CategoryItem,
  CourseSummary,
  DiscountCodeItem,
  OrderRecord,
  OrderStatus,
  PlatformSettings,
  PublicUser,
} from "../../../src/types";
import { generateSlug } from "../../../src/utils/formatters";
import { mergePlatformSettings } from "../../../src/utils/themeSettings";
import { createPrefixedId } from "../utils/crypto";
import { ConflictError, NotFoundError } from "../utils/errors";
import type {
  AdminOverviewStats,
  AttachmentEntity,
  ChapterEntity,
  CourseEntity,
  CourseInput,
  CourseListFilter,
  IRepository,
  LessonEntity,
  NotificationEntity,
  NotificationType,
  PaymentStatus,
  PaymentTransactionEntity,
  ReviewEntity,
  ReviewStatus,
  SessionEntity,
  UserEntity,
  UserRole,
  VerificationPurpose,
  VerificationTokenEntity,
} from "./repository";
import { getSeedData } from "./seedData";

interface DevEnrollment {
  id: string;
  userId: string;
  courseId: string;
  orderId: string | null;
  progressPercent: number;
  createdAt: string;
}

interface DevOrder {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentRef: string | null;
  couponCode: string | null;
  discountCodeId: string | null;
  items: Array<{ id: string; courseId: string; price: number }>;
  createdAt: string;
}

interface DevReviewRaw {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

interface DevStoreSchema {
  users: UserEntity[];
  sessions: SessionEntity[];
  verificationTokens: VerificationTokenEntity[];
  categories: CategoryItem[];
  courses: CourseEntity[];
  enrollments: DevEnrollment[];
  orders: DevOrder[];
  transactions: PaymentTransactionEntity[];
  discountCodes: DiscountCodeItem[];
  reviews: DevReviewRaw[];
  notifications: NotificationEntity[];
  settings: PlatformSettings;
}

export class DevFileRepository implements IRepository {
  private readonly filePath: string;
  private memoryStore: DevStoreSchema | null = null;
  private readonly useDisk: boolean;

  constructor(options?: { filePath?: string; inMemory?: boolean }) {
    this.useDisk = !options?.inMemory;
    this.filePath =
      options?.filePath ||
      path.resolve(process.cwd(), "data", "codeacademy-v2.json");
  }

  private createInitialStore(): DevStoreSchema {
    const seed = getSeedData();
    const now = new Date().toISOString();
    return {
      users: seed.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        bio: u.bio,
        avatarUrl: null,
        role: u.role,
        passwordHash: u.passwordHash,
        isEmailVerified: u.isEmailVerified,
        isPhoneVerified: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })),
      sessions: [],
      verificationTokens: [],
      categories: seed.categories,
      courses: seed.courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug || c.id,
        shortDesc: c.shortDesc,
        description: c.description,
        thumbnail: c.thumbnail,
        previewVideoUrl: c.previewVideoUrl || "",
        price: c.price,
        discountPrice: c.discountPrice,
        level: c.level,
        duration: c.duration,
        prerequisites: c.prerequisites,
        language: c.language || "فارسی",
        instructorId: c.instructorId ?? null,
        instructorName: c.instructorName,
        instructorTitle: c.instructorTitle,
        instructorBio: c.instructorBio || "",
        studentsCount: c.studentsCount,
        rating: c.rating,
        isPublished: c.isPublished,
        isFeatured: c.isFeatured,
        categoryId: c.categoryId,
        createdAt: c.createdAt,
        updatedAt: now,
        chapters: c.chapters.map((ch, cIdx) => ({
          id: ch.id || createPrefixedId("ch"),
          courseId: c.id,
          title: ch.title,
          position: ch.position ?? cIdx + 1,
          lessons: ch.lessons.map((les, lIdx) => ({
            id: les.id || createPrefixedId("ls"),
            chapterId: ch.id || "",
            title: les.title,
            duration: les.duration,
            videoUrl: les.videoUrl || "",
            isFree: les.isFree,
            position: les.position ?? lIdx + 1,
            summary: les.summary || "",
            codeSnippet: les.codeSnippet || "",
            attachments: [],
          })),
        })),
      })),
      enrollments: [],
      orders: [],
      transactions: [],
      discountCodes: seed.discountCodes,
      reviews: seed.reviews.map((r) => ({
        ...r,
        updatedAt: r.createdAt,
      })),
      notifications: [
        {
          id: "ntf_welcome_admin",
          userId: "usr_admin_1",
          title: "راه‌اندازی بک‌اند Serverless",
          message:
            "پلتفرم کدآکادمی با احراز هویت امن و مستندات Swagger آماده بهره‌برداری است.",
          type: "SYSTEM",
          isRead: false,
          link: "/admin",
          createdAt: now,
        },
      ],
      settings: seed.settings,
    };
  }

  private read(): DevStoreSchema {
    if (this.memoryStore) return this.memoryStore;
    if (this.useDisk && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        const parsed = JSON.parse(raw) as DevStoreSchema;
        if (Array.isArray(parsed.courses) && Array.isArray(parsed.users)) {
          parsed.settings = mergePlatformSettings(parsed.settings);
          this.memoryStore = parsed;
          return parsed;
        }
      } catch {
        // Re-seed if corrupted
      }
    }
    const init = this.createInitialStore();
    this.write(init);
    return init;
  }

  private write(store: DevStoreSchema): void {
    this.memoryStore = store;
    if (!this.useDisk) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }

  private toCourseSummary(c: CourseEntity, db: DevStoreSchema): CourseSummary {
    const cat = db.categories.find((item) => item.id === c.categoryId);
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDesc: c.shortDesc,
      thumbnail: c.thumbnail,
      price: c.price,
      discountPrice: c.discountPrice,
      level: c.level,
      duration: c.duration,
      instructorId: c.instructorId,
      instructorName: c.instructorName,
      instructorTitle: c.instructorTitle,
      studentsCount: c.studentsCount,
      rating: c.rating,
      isPublished: c.isPublished,
      isFeatured: c.isFeatured,
      categoryId: c.categoryId,
      category: cat
        ? { id: cat.id, name: cat.name, slug: cat.slug }
        : { id: c.categoryId, name: "برنامه‌نویسی", slug: "general" },
      createdAt: c.createdAt,
    };
  }

  private withCategory(c: CourseEntity, db: DevStoreSchema): CourseEntity {
    const cat = db.categories.find((item) => item.id === c.categoryId);
    return {
      ...c,
      category: cat
        ? { id: cat.id, name: cat.name, slug: cat.slug }
        : { id: c.categoryId, name: "برنامه‌نویسی", slug: "general" },
    };
  }

  private toOrderRecord(o: DevOrder, db: DevStoreSchema): OrderRecord {
    const user = db.users.find((u) => u.id === o.userId);
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      userName: user?.name,
      userEmail: user?.email,
      totalAmount: o.totalAmount,
      discountAmount: o.discountAmount,
      finalAmount: o.finalAmount,
      status: o.status,
      paymentRef: o.paymentRef,
      couponCode: o.couponCode,
      items: o.items.map((item) => {
        const course = db.courses.find((c) => c.id === item.courseId);
        return {
          id: item.id,
          courseId: item.courseId,
          courseTitle: course?.title ?? "دوره آموزشی",
          courseSlug: course?.slug ?? "",
          courseThumbnail: course?.thumbnail ?? "",
          price: item.price,
        };
      }),
      createdAt: o.createdAt,
    };
  }

  private toPublicUser(u: UserEntity): PublicUser {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      bio: u.bio,
      avatarUrl: u.avatarUrl,
      isEmailVerified: u.isEmailVerified,
      isPhoneVerified: u.isPhoneVerified,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  }

  async ping(): Promise<boolean> {
    this.read();
    return true;
  }

  async getSettings(): Promise<PlatformSettings> {
    return mergePlatformSettings(this.read().settings);
  }

  async updateSettings(settings: PlatformSettings): Promise<PlatformSettings> {
    const db = this.read();
    db.settings = mergePlatformSettings(settings);
    this.write(db);
    return db.settings;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.read().users.find((u) => u.id === id) ?? null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const clean = email.toLowerCase().trim();
    return this.read().users.find((u) => u.email.toLowerCase() === clean) ?? null;
  }

  async createUser(input: {
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
    role: UserRole;
  }): Promise<UserEntity> {
    const db = this.read();
    const cleanEmail = input.email.toLowerCase().trim();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new ConflictError("این ایمیل قبلاً در سیستم ثبت شده است.");
    }
    const now = new Date().toISOString();
    const user: UserEntity = {
      id: createPrefixedId("usr"),
      name: input.name.trim(),
      email: cleanEmail,
      phone: input.phone?.trim() || null,
      bio: null,
      avatarUrl: null,
      role: input.role,
      passwordHash: input.passwordHash,
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    db.users.unshift(user);
    this.write(db);
    return user;
  }

  async updateUserProfile(
    userId: string,
    input: { name: string; phone: string | null; bio: string | null; avatarUrl?: string | null }
  ): Promise<UserEntity> {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new NotFoundError("کاربر یافت نشد.");
    db.users[idx] = {
      ...db.users[idx],
      name: input.name.trim(),
      phone: input.phone !== undefined ? input.phone : db.users[idx].phone,
      bio: input.bio !== undefined ? input.bio : db.users[idx].bio,
      avatarUrl:
        input.avatarUrl !== undefined ? input.avatarUrl : db.users[idx].avatarUrl,
      updatedAt: new Date().toISOString(),
    };
    this.write(db);
    return db.users[idx];
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new NotFoundError("کاربر یافت نشد.");
    db.users[idx].passwordHash = passwordHash;
    db.users[idx].updatedAt = new Date().toISOString();
    this.write(db);
  }

  async markUserVerified(
    userId: string,
    field: "email" | "phone"
  ): Promise<UserEntity> {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new NotFoundError("کاربر یافت نشد.");
    if (field === "email") db.users[idx].isEmailVerified = true;
    else db.users[idx].isPhoneVerified = true;
    db.users[idx].updatedAt = new Date().toISOString();
    this.write(db);
    return db.users[idx];
  }

  async listUsers(filter: {
    q?: string;
    role?: UserRole;
    page: number;
    limit: number;
  }) {
    const db = this.read();
    let list = db.users;
    if (filter.role) list = list.filter((u) => u.role === filter.role);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const start = (filter.page - 1) * filter.limit;
    const sliced = list.slice(start, start + filter.limit);
    return {
      total,
      users: sliced.map((u) => ({
        ...u,
        enrolledCourseIds: db.enrollments
          .filter((e) => e.userId === u.id)
          .map((e) => e.courseId),
        ordersCount: db.orders.filter((o) => o.userId === u.id).length,
      })),
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserEntity> {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new NotFoundError("کاربر یافت نشد.");
    db.users[idx].role = role;
    db.users[idx].updatedAt = new Date().toISOString();
    this.write(db);
    return db.users[idx];
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<UserEntity> {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new NotFoundError("کاربر یافت نشد.");
    db.users[idx].isActive = isActive;
    db.users[idx].updatedAt = new Date().toISOString();
    this.write(db);
    return db.users[idx];
  }

  async createSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<SessionEntity> {
    const db = this.read();
    const s: SessionEntity = {
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: input.expiresAt.toISOString(),
      revokedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.sessions.unshift(s);
    this.write(db);
    return s;
  }

  async findSessionById(id: string): Promise<SessionEntity | null> {
    return this.read().sessions.find((s) => s.id === id) ?? null;
  }

  async findSessionByTokenHash(hash: string): Promise<SessionEntity | null> {
    return (
      this.read().sessions.find((s) => s.refreshTokenHash === hash) ?? null
    );
  }

  async rotateSessionToken(
    sessionId: string,
    nextRefreshTokenHash: string,
    nextExpiresAt: Date
  ): Promise<void> {
    const db = this.read();
    const idx = db.sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      db.sessions[idx].refreshTokenHash = nextRefreshTokenHash;
      db.sessions[idx].expiresAt = nextExpiresAt.toISOString();
      this.write(db);
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    const db = this.read();
    const idx = db.sessions.findIndex((s) => s.id === sessionId);
    if (idx !== -1) {
      db.sessions[idx].revokedAt = new Date().toISOString();
      this.write(db);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const db = this.read();
    const now = new Date().toISOString();
    db.sessions.forEach((s) => {
      if (s.userId === userId && !s.revokedAt) s.revokedAt = now;
    });
    this.write(db);
  }

  async listUserSessions(userId: string): Promise<SessionEntity[]> {
    const now = Date.now();
    return this.read().sessions.filter(
      (s) =>
        s.userId === userId &&
        !s.revokedAt &&
        new Date(s.expiresAt).getTime() > now
    );
  }

  async createVerificationToken(input: {
    userId: string;
    purpose: VerificationPurpose;
    target: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<VerificationTokenEntity> {
    const db = this.read();
    const token: VerificationTokenEntity = {
      id: createPrefixedId("vtk"),
      userId: input.userId,
      purpose: input.purpose,
      target: input.target,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt.toISOString(),
      consumedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.verificationTokens.unshift(token);
    this.write(db);
    return token;
  }

  async findValidVerificationToken(input: {
    userId?: string;
    target?: string;
    purpose: VerificationPurpose;
    codeHash: string;
  }): Promise<VerificationTokenEntity | null> {
    const now = Date.now();
    return (
      this.read().verificationTokens.find(
        (t) =>
          (!input.userId || t.userId === input.userId) &&
          (!input.target || t.target === input.target) &&
          t.purpose === input.purpose &&
          t.codeHash === input.codeHash &&
          !t.consumedAt &&
          new Date(t.expiresAt).getTime() > now
      ) ?? null
    );
  }

  async consumeVerificationToken(id: string): Promise<void> {
    const db = this.read();
    const idx = db.verificationTokens.findIndex((t) => t.id === id);
    if (idx !== -1) {
      db.verificationTokens[idx].consumedAt = new Date().toISOString();
      this.write(db);
    }
  }

  async listCategories(includeUnpublishedCount = false): Promise<CategoryItem[]> {
    const db = this.read();
    return db.categories.map((cat) => ({
      ...cat,
      coursesCount: db.courses.filter(
        (c) =>
          c.categoryId === cat.id &&
          (includeUnpublishedCount ? true : c.isPublished)
      ).length,
    }));
  }

  async findCategoryById(id: string): Promise<CategoryItem | null> {
    return this.read().categories.find((c) => c.id === id) ?? null;
  }

  async findCategoryBySlug(slug: string): Promise<CategoryItem | null> {
    return this.read().categories.find((c) => c.slug === slug) ?? null;
  }

  async createCategory(input: {
    name: string;
    slug: string;
    icon: string;
    description: string | null;
  }): Promise<CategoryItem> {
    const db = this.read();
    if (db.categories.some((c) => c.slug === input.slug)) {
      throw new ConflictError("اسلاگ این دسته‌بندی تکراری است.");
    }
    const cat: CategoryItem = {
      id: createPrefixedId("cat"),
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      description: input.description,
    };
    db.categories.push(cat);
    this.write(db);
    return cat;
  }

  async updateCategory(
    id: string,
    input: Partial<{
      name: string;
      slug: string;
      icon: string;
      description: string | null;
    }>
  ): Promise<CategoryItem> {
    const db = this.read();
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new NotFoundError("دسته‌بندی یافت نشد.");
    db.categories[idx] = { ...db.categories[idx], ...input };
    this.write(db);
    return db.categories[idx];
  }

  async deleteCategory(id: string): Promise<void> {
    const db = this.read();
    if (db.courses.some((c) => c.categoryId === id)) {
      throw new ConflictError(
        "این دسته‌بندی دارای دوره فعال است و ابتدا باید دوره‌های آن منتقل یا حذف شوند."
      );
    }
    db.categories = db.categories.filter((c) => c.id !== id);
    this.write(db);
  }

  async listCourses(
    filter: CourseListFilter
  ): Promise<{ courses: CourseSummary[]; total: number }> {
    const db = this.read();
    let list = db.courses.filter((c) =>
      filter.includeUnpublished ? true : c.isPublished
    );
    if (filter.featured) list = list.filter((c) => c.isFeatured);
    if (filter.instructorId) {
      list = list.filter((c) => c.instructorId === filter.instructorId);
    }
    if (filter.level) list = list.filter((c) => c.level === filter.level);
    if (filter.categorySlug) {
      const cat = db.categories.find((item) => item.slug === filter.categorySlug);
      list = cat ? list.filter((c) => c.categoryId === cat.id) : [];
    }
    if (filter.price === "free") {
      list = list.filter((c) => (c.discountPrice ?? c.price) === 0);
    } else if (filter.price === "paid") {
      list = list.filter((c) => (c.discountPrice ?? c.price) > 0);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDesc.toLowerCase().includes(q) ||
          c.instructorName.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (filter.sort === "popular") return b.studentsCount - a.studentsCount;
      if (filter.sort === "cheapest") {
        return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
      }
      if (filter.sort === "highest_rated") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = list.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const sliced = list.slice((page - 1) * limit, page * limit);
    return {
      total,
      courses: sliced.map((c) => this.toCourseSummary(c, db)),
    };
  }

  async searchCourses(q: string, limit = 6): Promise<CourseSummary[]> {
    const db = this.read();
    const lower = q.toLowerCase();
    return db.courses
      .filter(
        (c) =>
          c.isPublished &&
          (c.title.toLowerCase().includes(lower) ||
            c.shortDesc.toLowerCase().includes(lower) ||
            c.instructorName.toLowerCase().includes(lower))
      )
      .slice(0, limit)
      .map((c) => this.toCourseSummary(c, db));
  }

  async findCourseById(id: string): Promise<CourseEntity | null> {
    const db = this.read();
    const found = db.courses.find((c) => c.id === id);
    return found ? this.withCategory(found, db) : null;
  }

  async findCourseBySlugOrId(slugOrId: string): Promise<CourseEntity | null> {
    const db = this.read();
    const found = db.courses.find(
      (c) => c.slug === slugOrId || c.id === slugOrId
    );
    return found ? this.withCategory(found, db) : null;
  }

  async createCourse(input: CourseInput): Promise<CourseSummary> {
    const db = this.read();
    const baseSlug = generateSlug(input.slug?.trim() || input.title) || "course";
    const uniqueSlug = db.courses.some((c) => c.slug === baseSlug)
      ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
      : baseSlug;
    const now = new Date().toISOString();
    const courseId = createPrefixedId("crs");
    const course: CourseEntity = {
      id: courseId,
      title: input.title.trim(),
      slug: uniqueSlug,
      shortDesc: input.shortDesc.trim(),
      description: input.description.trim(),
      thumbnail: input.thumbnail.trim(),
      previewVideoUrl: input.previewVideoUrl?.trim() || "",
      price: Math.max(0, input.price),
      discountPrice: input.discountPrice,
      level: input.level,
      duration: input.duration.trim(),
      prerequisites: input.prerequisites.trim(),
      language: input.language?.trim() || "فارسی",
      instructorId: input.instructorId ?? null,
      instructorName: input.instructorName.trim(),
      instructorTitle: input.instructorTitle.trim(),
      instructorBio: input.instructorBio?.trim() || "",
      studentsCount: 0,
      rating: 5.0,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
      categoryId: input.categoryId,
      chapters: (input.chapters || []).map((ch, cIdx) => {
        const chId = ch.id || createPrefixedId("ch");
        return {
          id: chId,
          courseId,
          title: ch.title.trim(),
          position: ch.position ?? cIdx + 1,
          lessons: (ch.lessons || []).map((les, lIdx) => ({
            id: les.id || createPrefixedId("ls"),
            chapterId: chId,
            title: les.title.trim(),
            duration: les.duration.trim(),
            videoUrl: les.videoUrl.trim(),
            isFree: Boolean(les.isFree),
            position: les.position ?? lIdx + 1,
            summary: les.summary?.trim() || "",
            codeSnippet: les.codeSnippet?.trim() || "",
            attachments: [],
          })),
        };
      }),
      createdAt: now,
      updatedAt: now,
    };
    db.courses.unshift(course);
    this.write(db);
    return this.toCourseSummary(course, db);
  }

  async updateCourse(
    id: string,
    input: Partial<CourseInput>
  ): Promise<CourseSummary> {
    const db = this.read();
    const idx = db.courses.findIndex((c) => c.id === id);
    if (idx === -1) throw new NotFoundError("دوره یافت نشد.");
    const ex = db.courses[idx];
    db.courses[idx] = {
      ...ex,
      title: input.title !== undefined ? input.title.trim() : ex.title,
      slug:
        input.slug !== undefined && input.slug.trim()
          ? generateSlug(input.slug) || ex.slug
          : ex.slug,
      shortDesc:
        input.shortDesc !== undefined ? input.shortDesc.trim() : ex.shortDesc,
      description:
        input.description !== undefined
          ? input.description.trim()
          : ex.description,
      thumbnail:
        input.thumbnail !== undefined ? input.thumbnail.trim() : ex.thumbnail,
      previewVideoUrl:
        input.previewVideoUrl !== undefined
          ? input.previewVideoUrl.trim()
          : ex.previewVideoUrl,
      price: input.price !== undefined ? Math.max(0, input.price) : ex.price,
      discountPrice:
        input.discountPrice !== undefined
          ? input.discountPrice
          : ex.discountPrice,
      level: input.level ?? ex.level,
      duration:
        input.duration !== undefined ? input.duration.trim() : ex.duration,
      prerequisites:
        input.prerequisites !== undefined
          ? input.prerequisites.trim()
          : ex.prerequisites,
      instructorName:
        input.instructorName !== undefined
          ? input.instructorName.trim()
          : ex.instructorName,
      instructorTitle:
        input.instructorTitle !== undefined
          ? input.instructorTitle.trim()
          : ex.instructorTitle,
      instructorBio:
        input.instructorBio !== undefined
          ? input.instructorBio.trim()
          : ex.instructorBio,
      categoryId: input.categoryId ?? ex.categoryId,
      isPublished:
        input.isPublished !== undefined ? input.isPublished : ex.isPublished,
      isFeatured:
        input.isFeatured !== undefined ? input.isFeatured : ex.isFeatured,
      chapters: Array.isArray(input.chapters)
        ? input.chapters.map((ch, cIdx) => {
            const chId = ch.id || createPrefixedId("ch");
            return {
              id: chId,
              courseId: id,
              title: ch.title.trim(),
              position: ch.position ?? cIdx + 1,
              lessons: (ch.lessons || []).map((les, lIdx) => ({
                id: les.id || createPrefixedId("ls"),
                chapterId: chId,
                title: les.title.trim(),
                duration: les.duration.trim(),
                videoUrl: les.videoUrl.trim(),
                isFree: Boolean(les.isFree),
                position: les.position ?? lIdx + 1,
                summary: les.summary?.trim() || "",
                codeSnippet: les.codeSnippet?.trim() || "",
                attachments: [],
              })),
            };
          })
        : ex.chapters,
      updatedAt: new Date().toISOString(),
    };
    this.write(db);
    return this.toCourseSummary(db.courses[idx], db);
  }

  async setCoursePublished(
    id: string,
    isPublished: boolean
  ): Promise<CourseSummary> {
    return this.updateCourse(id, { isPublished });
  }

  async duplicateCourse(id: string): Promise<CourseSummary> {
    const existing = await this.findCourseById(id);
    if (!existing) throw new NotFoundError("دوره مورد نظر یافت نشد.");
    return this.createCourse({
      ...existing,
      title: `${existing.title} (کپی)`,
      slug: `${existing.slug}-copy-${Date.now().toString().slice(-4)}`,
      isPublished: false,
      isFeatured: false,
      chapters: existing.chapters.map((ch) => ({
        title: ch.title,
        position: ch.position,
        lessons: ch.lessons.map((l) => ({
          title: l.title,
          duration: l.duration,
          videoUrl: l.videoUrl,
          isFree: l.isFree,
          position: l.position,
          summary: l.summary,
          codeSnippet: l.codeSnippet,
        })),
      })),
    });
  }

  async deleteCourse(id: string): Promise<void> {
    const db = this.read();
    db.courses = db.courses.filter((c) => c.id !== id);
    db.enrollments = db.enrollments.filter((e) => e.courseId !== id);
    db.reviews = db.reviews.filter((r) => r.courseId !== id);
    this.write(db);
  }

  async findLessonWithCourse(
    lessonId: string
  ): Promise<{ lesson: LessonEntity; course: CourseEntity } | null> {
    const db = this.read();
    for (const course of db.courses) {
      for (const ch of course.chapters) {
        const les = ch.lessons.find((l) => l.id === lessonId);
        if (les) return { lesson: les, course: this.withCategory(course, db) };
      }
    }
    return null;
  }

  async addChapter(
    courseId: string,
    input: { title: string; position?: number }
  ): Promise<ChapterEntity> {
    const db = this.read();
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) throw new NotFoundError("دوره یافت نشد.");
    const ch: ChapterEntity = {
      id: createPrefixedId("ch"),
      courseId,
      title: input.title.trim(),
      position: input.position ?? course.chapters.length + 1,
      lessons: [],
    };
    course.chapters.push(ch);
    this.write(db);
    return ch;
  }

  async updateChapter(
    chapterId: string,
    input: { title?: string; position?: number }
  ): Promise<ChapterEntity> {
    const db = this.read();
    for (const course of db.courses) {
      const ch = course.chapters.find((item) => item.id === chapterId);
      if (ch) {
        if (input.title !== undefined) ch.title = input.title.trim();
        if (input.position !== undefined) ch.position = input.position;
        this.write(db);
        return ch;
      }
    }
    throw new NotFoundError("فصل یافت نشد.");
  }

  async deleteChapter(chapterId: string): Promise<void> {
    const db = this.read();
    for (const course of db.courses) {
      const before = course.chapters.length;
      course.chapters = course.chapters.filter((ch) => ch.id !== chapterId);
      if (course.chapters.length !== before) {
        this.write(db);
        return;
      }
    }
    throw new NotFoundError("فصل یافت نشد.");
  }

  async addLesson(
    chapterId: string,
    input: {
      title: string;
      duration: string;
      videoUrl: string;
      isFree: boolean;
      position?: number;
      summary?: string;
      codeSnippet?: string;
    }
  ): Promise<LessonEntity> {
    const db = this.read();
    for (const course of db.courses) {
      const ch = course.chapters.find((item) => item.id === chapterId);
      if (ch) {
        const les: LessonEntity = {
          id: createPrefixedId("ls"),
          chapterId,
          title: input.title.trim(),
          duration: input.duration.trim(),
          videoUrl: input.videoUrl.trim(),
          isFree: input.isFree,
          position: input.position ?? ch.lessons.length + 1,
          summary: input.summary?.trim() || "",
          codeSnippet: input.codeSnippet?.trim() || "",
          attachments: [],
        };
        ch.lessons.push(les);
        this.write(db);
        return les;
      }
    }
    throw new NotFoundError("فصل یافت نشد.");
  }

  async updateLesson(
    lessonId: string,
    input: Partial<{
      title: string;
      duration: string;
      videoUrl: string;
      isFree: boolean;
      position: number;
      summary: string;
      codeSnippet: string;
    }>
  ): Promise<LessonEntity> {
    const db = this.read();
    for (const course of db.courses) {
      for (const ch of course.chapters) {
        const idx = ch.lessons.findIndex((l) => l.id === lessonId);
        if (idx !== -1) {
          ch.lessons[idx] = { ...ch.lessons[idx], ...input };
          this.write(db);
          return ch.lessons[idx];
        }
      }
    }
    throw new NotFoundError("جلسه یافت نشد.");
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const db = this.read();
    for (const course of db.courses) {
      for (const ch of course.chapters) {
        const before = ch.lessons.length;
        ch.lessons = ch.lessons.filter((l) => l.id !== lessonId);
        if (ch.lessons.length !== before) {
          this.write(db);
          return;
        }
      }
    }
    throw new NotFoundError("جلسه یافت نشد.");
  }

  async addLessonAttachment(input: {
    lessonId: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }): Promise<AttachmentEntity> {
    const db = this.read();
    for (const course of db.courses) {
      for (const ch of course.chapters) {
        const les = ch.lessons.find((l) => l.id === input.lessonId);
        if (les) {
          const att: AttachmentEntity = {
            id: createPrefixedId("att"),
            lessonId: input.lessonId,
            title: input.title,
            fileUrl: input.fileUrl,
            fileType: input.fileType,
            fileSize: input.fileSize,
            createdAt: new Date().toISOString(),
          };
          les.attachments = [...(les.attachments || []), att];
          this.write(db);
          return att;
        }
      }
    }
    throw new NotFoundError("جلسه یافت نشد.");
  }

  async deleteLessonAttachment(id: string): Promise<void> {
    const db = this.read();
    for (const course of db.courses) {
      for (const ch of course.chapters) {
        for (const les of ch.lessons) {
          const before = (les.attachments || []).length;
          les.attachments = (les.attachments || []).filter((a) => a.id !== id);
          if (les.attachments.length !== before) {
            this.write(db);
            return;
          }
        }
      }
    }
  }

  async getEnrolledCourseIds(userId: string): Promise<string[]> {
    return this.read()
      .enrollments.filter((e) => e.userId === userId)
      .map((e) => e.courseId);
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    return this.read().enrollments.some(
      (e) => e.userId === userId && e.courseId === courseId
    );
  }

  async getStudentEnrolledCourses(userId: string) {
    const db = this.read();
    const myEnrollments = db.enrollments.filter((e) => e.userId === userId);
    const items: Array<
      CourseSummary & {
        chaptersCount: number;
        lessonsCount: number;
        progressPercent: number;
      }
    > = [];
    for (const enr of myEnrollments) {
      const c = db.courses.find((crs) => crs.id === enr.courseId);
      if (c) {
        items.push({
          ...this.toCourseSummary(c, db),
          chaptersCount: c.chapters.length,
          lessonsCount: c.chapters.reduce((s, ch) => s + ch.lessons.length, 0),
          progressPercent: enr.progressPercent,
        });
      }
    }
    return items;
  }

  async createEnrollment(input: {
    userId: string;
    courseId: string;
    orderId?: string | null;
  }): Promise<{ created: boolean }> {
    const db = this.read();
    if (
      db.enrollments.some(
        (e) => e.userId === input.userId && e.courseId === input.courseId
      )
    ) {
      return { created: false };
    }
    const course = db.courses.find((c) => c.id === input.courseId);
    if (!course) throw new NotFoundError("دوره یافت نشد.");
    db.enrollments.push({
      id: createPrefixedId("enr"),
      userId: input.userId,
      courseId: input.courseId,
      orderId: input.orderId ?? null,
      progressPercent: 0,
      createdAt: new Date().toISOString(),
    });
    course.studentsCount += 1;
    this.write(db);
    return { created: true };
  }

  async deleteEnrollment(userId: string, courseId: string): Promise<void> {
    const db = this.read();
    db.enrollments = db.enrollments.filter(
      (e) => !(e.userId === userId && e.courseId === courseId)
    );
    this.write(db);
  }

  async findCouponByCode(code: string): Promise<DiscountCodeItem | null> {
    const clean = code.trim().toUpperCase();
    return this.read().discountCodes.find((d) => d.code === clean) ?? null;
  }

  async listCoupons(): Promise<DiscountCodeItem[]> {
    return this.read().discountCodes;
  }

  async createCoupon(input: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<DiscountCodeItem> {
    const db = this.read();
    const clean = input.code.trim().toUpperCase();
    if (db.discountCodes.some((d) => d.code === clean)) {
      throw new ConflictError("این کد تخفیف قبلاً ثبت شده است.");
    }
    const cpn: DiscountCodeItem = {
      id: createPrefixedId("cpn"),
      code: clean,
      type: input.type,
      value: input.value,
      maxUses: input.maxUses,
      usedCount: 0,
      expiresAt: input.expiresAt ? input.expiresAt.toISOString() : null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.discountCodes.unshift(cpn);
    this.write(db);
    return cpn;
  }

  async updateCouponStatus(
    id: string,
    isActive: boolean
  ): Promise<DiscountCodeItem> {
    const db = this.read();
    const idx = db.discountCodes.findIndex((d) => d.id === id);
    if (idx === -1) throw new NotFoundError("کد تخفیف یافت نشد.");
    db.discountCodes[idx].isActive = isActive;
    this.write(db);
    return db.discountCodes[idx];
  }

  async deleteCoupon(id: string): Promise<void> {
    const db = this.read();
    db.discountCodes = db.discountCodes.filter((d) => d.id !== id);
    this.write(db);
  }

  async createPendingOrder(input: {
    orderNumber: string;
    userId: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponCode: string | null;
    discountCodeId: string | null;
    items: Array<{ courseId: string; price: number }>;
  }): Promise<OrderRecord> {
    const db = this.read();
    const order: DevOrder = {
      id: createPrefixedId("ord"),
      orderNumber: input.orderNumber,
      userId: input.userId,
      totalAmount: input.totalAmount,
      discountAmount: input.discountAmount,
      finalAmount: input.finalAmount,
      status: "PENDING",
      paymentRef: null,
      couponCode: input.couponCode,
      discountCodeId: input.discountCodeId,
      items: input.items.map((i) => ({
        id: createPrefixedId("ori"),
        courseId: i.courseId,
        price: i.price,
      })),
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order);
    this.write(db);
    return this.toOrderRecord(order, db);
  }

  async findOrderById(orderId: string): Promise<OrderRecord | null> {
    const db = this.read();
    const ord = db.orders.find((o) => o.id === orderId);
    return ord ? this.toOrderRecord(ord, db) : null;
  }

  async findOrderByAuthority(authority: string) {
    const db = this.read();
    const tx = db.transactions.find((t) => t.authority === authority);
    if (!tx) return null;
    const ord = db.orders.find((o) => o.id === tx.orderId);
    if (!ord) return null;
    return { order: this.toOrderRecord(ord, db), transaction: tx };
  }

  async createPaymentTransaction(input: {
    orderId: string;
    gateway: string;
    authority: string | null;
    amount: number;
    status: PaymentStatus;
    rawResponse?: unknown;
  }): Promise<PaymentTransactionEntity> {
    const db = this.read();
    const tx: PaymentTransactionEntity = {
      id: createPrefixedId("pay"),
      orderId: input.orderId,
      gateway: input.gateway,
      authority: input.authority,
      refId: null,
      amount: input.amount,
      status: input.status,
      rawResponse: input.rawResponse,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    this.write(db);
    return tx;
  }

  async completeOrderPayment(input: {
    orderId: string;
    paymentRef: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<{ order: OrderRecord; enrolledCourseIds: string[] }> {
    const db = this.read();
    const idx = db.orders.findIndex((o) => o.id === input.orderId);
    if (idx === -1) throw new NotFoundError("سفارش یافت نشد.");
    const ord = db.orders[idx];
    if (ord.status === "COMPLETED") {
      return {
        order: this.toOrderRecord(ord, db),
        enrolledCourseIds: ord.items.map((i) => i.courseId),
      };
    }

    ord.status = "COMPLETED";
    ord.paymentRef = input.paymentRef;

    if (input.authority) {
      const txIdx = db.transactions.findIndex(
        (t) => t.authority === input.authority && t.orderId === ord.id
      );
      if (txIdx !== -1) {
        db.transactions[txIdx].status = "VERIFIED";
        db.transactions[txIdx].refId = input.paymentRef;
        db.transactions[txIdx].verifiedAt = new Date().toISOString();
        db.transactions[txIdx].rawResponse = input.rawResponse;
      }
    }

    if (ord.couponCode) {
      const cIdx = db.discountCodes.findIndex((d) => d.code === ord.couponCode);
      if (cIdx !== -1) db.discountCodes[cIdx].usedCount += 1;
    }

    const enrolledCourseIds: string[] = [];
    for (const item of ord.items) {
      const exists = db.enrollments.some(
        (e) => e.userId === ord.userId && e.courseId === item.courseId
      );
      if (!exists) {
        db.enrollments.push({
          id: createPrefixedId("enr"),
          userId: ord.userId,
          courseId: item.courseId,
          orderId: ord.id,
          progressPercent: 0,
          createdAt: new Date().toISOString(),
        });
        const crsIdx = db.courses.findIndex((c) => c.id === item.courseId);
        if (crsIdx !== -1) db.courses[crsIdx].studentsCount += 1;
      }
      enrolledCourseIds.push(item.courseId);
    }

    this.write(db);
    return { order: this.toOrderRecord(ord, db), enrolledCourseIds };
  }

  async failOrderPayment(input: {
    orderId: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<void> {
    const db = this.read();
    const ord = db.orders.find((o) => o.id === input.orderId);
    if (ord && ord.status === "PENDING") {
      ord.status = "FAILED";
    }
    if (input.authority) {
      const tx = db.transactions.find(
        (t) => t.authority === input.authority && t.orderId === input.orderId
      );
      if (tx) {
        tx.status = "FAILED";
        tx.rawResponse = input.rawResponse;
      }
    }
    this.write(db);
  }

  async listUserOrders(userId: string): Promise<OrderRecord[]> {
    const db = this.read();
    return db.orders
      .filter((o) => o.userId === userId)
      .map((o) => this.toOrderRecord(o, db));
  }

  async listAdminOrders(filter: {
    status?: OrderStatus;
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ orders: OrderRecord[]; total: number }> {
    const db = this.read();
    let list = db.orders.map((o) => this.toOrderRecord(o, db));
    if (filter.status) list = list.filter((o) => o.status === filter.status);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.userName || "").toLowerCase().includes(q) ||
          (o.userEmail || "").toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const start = (filter.page - 1) * filter.limit;
    return { total, orders: list.slice(start, start + filter.limit) };
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<OrderRecord> {
    const db = this.read();
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new NotFoundError("سفارش یافت نشد.");
    db.orders[idx].status = status;
    this.write(db);
    return this.toOrderRecord(db.orders[idx], db);
  }

  private recalcCourseRating(courseId: string, db: DevStoreSchema): number {
    const approved = db.reviews.filter(
      (r) => r.courseId === courseId && r.status === "APPROVED"
    );
    const avg = approved.length
      ? Number(
          (
            approved.reduce((s, r) => s + r.rating, 0) / approved.length
          ).toFixed(1)
        )
      : 5.0;
    const crs = db.courses.find((c) => c.id === courseId);
    if (crs) crs.rating = avg;
    return avg;
  }

  private mapReview(r: DevReviewRaw, db: DevStoreSchema): ReviewEntity {
    const u = db.users.find((usr) => usr.id === r.userId);
    const c = db.courses.find((crs) => crs.id === r.courseId);
    return {
      ...r,
      userName: u?.name ?? "کاربر کدآکادمی",
      courseTitle: c?.title,
    };
  }

  async listCourseReviews(
    courseId: string,
    includeAllStatuses = false
  ): Promise<ReviewEntity[]> {
    const db = this.read();
    return db.reviews
      .filter(
        (r) =>
          r.courseId === courseId &&
          (includeAllStatuses ? true : r.status === "APPROVED")
      )
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((r) => this.mapReview(r, db));
  }

  async findReviewById(id: string): Promise<ReviewEntity | null> {
    const db = this.read();
    const r = db.reviews.find((item) => item.id === id);
    return r ? this.mapReview(r, db) : null;
  }

  async createReview(input: {
    courseId: string;
    userId: string;
    rating: number;
    comment: string;
    status?: ReviewStatus;
  }): Promise<{ review: ReviewEntity; courseRating: number }> {
    const db = this.read();
    if (
      db.reviews.some(
        (r) => r.userId === input.userId && r.courseId === input.courseId
      )
    ) {
      throw new ConflictError(
        "شما قبلاً برای این دوره دیدگاه ثبت کرده‌اید. می‌توانید دیدگاه قبلی خود را ویرایش کنید."
      );
    }
    const now = new Date().toISOString();
    const raw: DevReviewRaw = {
      id: createPrefixedId("rev"),
      courseId: input.courseId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment.trim(),
      status: input.status ?? "APPROVED",
      createdAt: now,
      updatedAt: now,
    };
    db.reviews.unshift(raw);
    const courseRating = this.recalcCourseRating(input.courseId, db);
    this.write(db);
    return { review: this.mapReview(raw, db), courseRating };
  }

  async updateReview(
    id: string,
    input: { rating?: number; comment?: string }
  ): Promise<{ review: ReviewEntity; courseRating: number }> {
    const db = this.read();
    const idx = db.reviews.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundError("دیدگاه یافت نشد.");
    if (input.rating !== undefined) db.reviews[idx].rating = input.rating;
    if (input.comment !== undefined) db.reviews[idx].comment = input.comment.trim();
    db.reviews[idx].updatedAt = new Date().toISOString();
    const courseRating = this.recalcCourseRating(db.reviews[idx].courseId, db);
    this.write(db);
    return { review: this.mapReview(db.reviews[idx], db), courseRating };
  }

  async moderateReview(
    id: string,
    status: ReviewStatus
  ): Promise<{ review: ReviewEntity; courseRating: number }> {
    const db = this.read();
    const idx = db.reviews.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundError("دیدگاه یافت نشد.");
    db.reviews[idx].status = status;
    db.reviews[idx].updatedAt = new Date().toISOString();
    const courseRating = this.recalcCourseRating(db.reviews[idx].courseId, db);
    this.write(db);
    return { review: this.mapReview(db.reviews[idx], db), courseRating };
  }

  async deleteReview(id: string): Promise<{ courseRating: number }> {
    const db = this.read();
    const ex = db.reviews.find((r) => r.id === id);
    if (!ex) throw new NotFoundError("دیدگاه یافت نشد.");
    db.reviews = db.reviews.filter((r) => r.id !== id);
    const courseRating = this.recalcCourseRating(ex.courseId, db);
    this.write(db);
    return { courseRating };
  }

  async listAdminReviews(filter: {
    status?: ReviewStatus;
    page: number;
    limit: number;
  }): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const db = this.read();
    let list = db.reviews;
    if (filter.status) list = list.filter((r) => r.status === filter.status);
    const total = list.length;
    const start = (filter.page - 1) * filter.limit;
    return {
      total,
      reviews: list
        .slice(start, start + filter.limit)
        .map((r) => this.mapReview(r, db)),
    };
  }

  async listUserNotifications(
    userId: string,
    limit = 30
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number }> {
    const list = this.read().notifications.filter((n) => n.userId === userId);
    return {
      unreadCount: list.filter((n) => !n.isRead).length,
      notifications: list.slice(0, limit),
    };
  }

  async createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
  }): Promise<NotificationEntity> {
    const db = this.read();
    const n: NotificationEntity = {
      id: createPrefixedId("ntf"),
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
      link: input.link ?? null,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(n);
    this.write(db);
    return n;
  }

  async broadcastNotification(input: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
    targetRole?: UserRole;
  }): Promise<number> {
    const db = this.read();
    const targets = db.users.filter(
      (u) => u.isActive && (!input.targetRole || u.role === input.targetRole)
    );
    const now = new Date().toISOString();
    for (const u of targets) {
      db.notifications.unshift({
        id: createPrefixedId("ntf"),
        userId: u.id,
        title: input.title,
        message: input.message,
        type: input.type,
        isRead: false,
        link: input.link ?? null,
        createdAt: now,
      });
    }
    this.write(db);
    return targets.length;
  }

  async markNotificationRead(userId: string, id: string): Promise<void> {
    const db = this.read();
    const n = db.notifications.find((item) => item.id === id && item.userId === userId);
    if (n) {
      n.isRead = true;
      this.write(db);
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const db = this.read();
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    this.write(db);
  }

  async getAdminOverview(): Promise<{
    stats: AdminOverviewStats;
    recentOrders: OrderRecord[];
    recentRegistrations: PublicUser[];
  }> {
    const db = this.read();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const completed = db.orders.filter((o) => o.status === "COMPLETED");
    const totalRevenue = completed.reduce((s, o) => s + o.finalAmount, 0);
    const monthlyRevenue = completed
      .filter((o) => new Date(o.createdAt) >= startOfMonth)
      .reduce((s, o) => s + o.finalAmount, 0);

    return {
      stats: {
        totalUsers: db.users.length,
        totalStudents: db.users.filter((u) => u.role === "STUDENT").length,
        totalInstructors: db.users.filter((u) => u.role === "INSTRUCTOR").length,
        totalCourses: db.courses.length,
        publishedCourses: db.courses.filter((c) => c.isPublished).length,
        totalOrdersCount: db.orders.length,
        completedOrdersCount: completed.length,
        totalRevenue,
        monthlyRevenue,
        totalEnrollments: db.enrollments.length,
        pendingReviewsCount: db.reviews.filter((r) => r.status === "PENDING")
          .length,
      },
      recentOrders: db.orders.slice(0, 10).map((o) => this.toOrderRecord(o, db)),
      recentRegistrations: db.users.slice(0, 8).map((u) => this.toPublicUser(u)),
    };
  }

  async getInstructorOverview(instructorId: string) {
    const db = this.read();
    const courses = db.courses.filter((c) => c.instructorId === instructorId);
    const courseIds = new Set(courses.map((c) => c.id));
    let totalRevenue = 0;
    for (const ord of db.orders) {
      if (ord.status !== "COMPLETED") continue;
      for (const item of ord.items) {
        if (courseIds.has(item.courseId)) totalRevenue += item.price;
      }
    }
    const totalStudents = courses.reduce((s, c) => s + c.studentsCount, 0);
    const averageRating = courses.length
      ? Number(
          (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1)
        )
      : 5.0;

    return {
      stats: {
        coursesCount: courses.length,
        publishedCoursesCount: courses.filter((c) => c.isPublished).length,
        totalStudents,
        totalRevenue,
        averageRating,
      },
      courses: courses.map((c) => this.toCourseSummary(c, db)),
    };
  }
}
