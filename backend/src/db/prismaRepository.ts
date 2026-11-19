import type { Prisma } from "@prisma/client";
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
import {
  DEFAULT_PLATFORM_SETTINGS,
  mergePlatformSettings,
} from "../../../src/utils/themeSettings";
import { ConflictError, NotFoundError } from "../utils/errors";
import { getPrismaClient } from "./prisma";
import { seedDatabaseIfEmpty } from "./prismaSeed";
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

function mapUser(u: any): UserEntity {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    role: u.role as UserRole,
    passwordHash: u.passwordHash,
    isEmailVerified: Boolean(u.isEmailVerified),
    isPhoneVerified: Boolean(u.isPhoneVerified),
    isActive: Boolean(u.isActive),
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function mapPublicUser(u: any): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "ADMIN" ? "ADMIN" : u.role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT",
    phone: u.phone ?? null,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    isEmailVerified: Boolean(u.isEmailVerified),
    isPhoneVerified: Boolean(u.isPhoneVerified),
    isActive: Boolean(u.isActive),
    createdAt: u.createdAt.toISOString(),
  };
}

function mapCourseSummary(c: any): CourseSummary {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    shortDesc: c.shortDesc,
    thumbnail: c.thumbnail,
    price: c.price,
    discountPrice: c.discountPrice ?? null,
    level: c.level,
    duration: c.duration,
    instructorId: c.instructorId ?? null,
    instructorName: c.instructorName,
    instructorTitle: c.instructorTitle,
    studentsCount: c.studentsCount,
    rating: c.rating,
    isPublished: c.isPublished,
    isFeatured: c.isFeatured,
    categoryId: c.categoryId,
    category: c.category
      ? { id: c.category.id, name: c.category.name, slug: c.category.slug }
      : { id: c.categoryId, name: "برنامه‌نویسی", slug: "general" },
    createdAt: c.createdAt.toISOString(),
  };
}

function mapCourseEntity(c: any): CourseEntity {
  return {
    ...mapCourseSummary(c),
    description: c.description,
    previewVideoUrl: c.previewVideoUrl ?? "",
    prerequisites: c.prerequisites ?? "",
    language: c.language ?? "فارسی",
    instructorId: c.instructorId ?? null,
    instructorBio: c.instructorBio ?? "",
    updatedAt: c.updatedAt.toISOString(),
    chapters: (c.chapters || [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((ch: any) => ({
        id: ch.id,
        courseId: ch.courseId,
        title: ch.title,
        position: ch.position,
        lessons: (ch.lessons || [])
          .slice()
          .sort((a: any, b: any) => a.position - b.position)
          .map((les: any) => ({
            id: les.id,
            chapterId: les.chapterId,
            title: les.title,
            duration: les.duration,
            videoUrl: les.videoUrl ?? "",
            isFree: Boolean(les.isFree),
            position: les.position,
            summary: les.summary ?? "",
            codeSnippet: les.codeSnippet ?? "",
            attachments: (les.attachments || []).map((att: any) => ({
              id: att.id,
              lessonId: att.lessonId,
              title: att.title,
              fileUrl: att.fileUrl,
              fileType: att.fileType,
              fileSize: att.fileSize,
              createdAt: att.createdAt.toISOString(),
            })),
          })),
      })),
  };
}

function mapOrderRecord(o: any): OrderRecord {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    userId: o.userId,
    userName: o.user?.name,
    userEmail: o.user?.email,
    totalAmount: o.totalAmount,
    discountAmount: o.discountAmount,
    finalAmount: o.finalAmount,
    status: o.status as OrderStatus,
    paymentRef: o.paymentRef ?? null,
    couponCode: o.couponCode ?? null,
    items: (o.items || []).map((item: any) => ({
      id: item.id,
      courseId: item.courseId,
      courseTitle: item.course?.title ?? "دوره آموزشی",
      courseSlug: item.course?.slug ?? "",
      courseThumbnail: item.course?.thumbnail ?? "",
      price: item.price,
    })),
    createdAt: o.createdAt.toISOString(),
  };
}

function mapReviewEntity(r: any): ReviewEntity {
  return {
    id: r.id,
    courseId: r.courseId,
    userId: r.userId,
    userName: r.user?.name ?? "کاربر کدآکادمی",
    courseTitle: r.course?.title,
    rating: r.rating,
    comment: r.comment,
    status: r.status as ReviewStatus,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export class PrismaRepository implements IRepository {
  private seedPromise: Promise<void> | null = null;

  private get prisma() {
    return getPrismaClient();
  }

  async ping(): Promise<boolean> {
    await this.prisma.$queryRaw`SELECT 1`;
    await this.ensureSeeded();
    return true;
  }

  async ensureSeeded(): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = seedDatabaseIfEmpty(this.prisma)
        .then(() => undefined)
        .catch((err) => {
          this.seedPromise = null;
          throw err;
        });
    }
    return this.seedPromise;
  }

  async getSettings(): Promise<PlatformSettings> {
    const row = await this.prisma.platformSetting.findUnique({
      where: { id: "default" },
    });
    if (!row || !row.data || typeof row.data !== "object") {
      return { ...DEFAULT_PLATFORM_SETTINGS };
    }
    return mergePlatformSettings(row.data as Partial<PlatformSettings>);
  }

  async updateSettings(settings: PlatformSettings): Promise<PlatformSettings> {
    const merged = mergePlatformSettings(settings);
    await this.prisma.platformSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        data: merged as unknown as Prisma.InputJsonValue,
      },
      update: {
        data: merged as unknown as Prisma.InputJsonValue,
      },
    });
    return merged;
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? mapUser(user) : null;
  }

  async createUser(input: {
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
    role: UserRole;
  }): Promise<UserEntity> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const exists = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (exists) {
      throw new ConflictError("این ایمیل قبلاً در سیستم ثبت شده است.");
    }
    const created = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || null,
        passwordHash: input.passwordHash,
        role: input.role,
      },
    });
    return mapUser(created);
  }

  async updateUserProfile(
    userId: string,
    input: { name: string; phone: string | null; bio: string | null; avatarUrl?: string | null }
  ): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundError("کاربر یافت نشد.");
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        phone: input.phone !== undefined ? input.phone : existing.phone,
        bio: input.bio !== undefined ? input.bio : existing.bio,
        avatarUrl:
          input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl,
      },
    });
    return mapUser(updated);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markUserVerified(
    userId: string,
    field: "email" | "phone"
  ): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data:
        field === "email"
          ? { isEmailVerified: true }
          : { isPhoneVerified: true },
    });
    return mapUser(updated);
  }

  async listUsers(filter: {
    q?: string;
    role?: UserRole;
    page: number;
    limit: number;
  }) {
    const where: Prisma.UserWhereInput = {};
    if (filter.role) where.role = filter.role;
    if (filter.q) {
      where.OR = [
        { name: { contains: filter.q, mode: "insensitive" } },
        { email: { contains: filter.q, mode: "insensitive" } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          enrollments: { select: { courseId: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);
    return {
      total,
      users: rows.map((u) => ({
        ...mapUser(u),
        enrolledCourseIds: u.enrollments.map((e) => e.courseId),
        ordersCount: u._count.orders,
      })),
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return mapUser(updated);
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    return mapUser(updated);
  }

  async createSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<SessionEntity> {
    const s = await this.prisma.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: s.id,
      userId: s.userId,
      refreshTokenHash: s.refreshTokenHash,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async findSessionById(id: string): Promise<SessionEntity | null> {
    const s = await this.prisma.session.findUnique({ where: { id } });
    if (!s) return null;
    return {
      id: s.id,
      userId: s.userId,
      refreshTokenHash: s.refreshTokenHash,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async findSessionByTokenHash(hash: string): Promise<SessionEntity | null> {
    const s = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
    });
    if (!s) return null;
    return {
      id: s.id,
      userId: s.userId,
      refreshTokenHash: s.refreshTokenHash,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    };
  }

  async rotateSessionToken(
    sessionId: string,
    nextRefreshTokenHash: string,
    nextExpiresAt: Date
  ): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: nextRefreshTokenHash,
        expiresAt: nextExpiresAt,
      },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listUserSessions(userId: string): Promise<SessionEntity[]> {
    const rows = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((s) => ({
      id: s.id,
      userId: s.userId,
      refreshTokenHash: s.refreshTokenHash,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async createVerificationToken(input: {
    userId: string;
    purpose: VerificationPurpose;
    target: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<VerificationTokenEntity> {
    const row = await this.prisma.verificationToken.create({
      data: {
        userId: input.userId,
        purpose: input.purpose,
        target: input.target,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      purpose: row.purpose as VerificationPurpose,
      target: row.target,
      codeHash: row.codeHash,
      expiresAt: row.expiresAt.toISOString(),
      consumedAt: row.consumedAt ? row.consumedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findValidVerificationToken(input: {
    userId?: string;
    target?: string;
    purpose: VerificationPurpose;
    codeHash: string;
  }): Promise<VerificationTokenEntity | null> {
    const row = await this.prisma.verificationToken.findFirst({
      where: {
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.target ? { target: input.target } : {}),
        purpose: input.purpose,
        codeHash: input.codeHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      purpose: row.purpose as VerificationPurpose,
      target: row.target,
      codeHash: row.codeHash,
      expiresAt: row.expiresAt.toISOString(),
      consumedAt: row.consumedAt ? row.consumedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async consumeVerificationToken(id: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async listCategories(includeUnpublishedCount = false): Promise<CategoryItem[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        courses: {
          where: includeUnpublishedCount ? {} : { isPublished: true },
          select: { id: true },
        },
      },
    });
    return rows.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description ?? null,
      coursesCount: cat.courses.length,
    }));
  }

  async findCategoryById(id: string): Promise<CategoryItem | null> {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    return cat
      ? {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description ?? null,
        }
      : null;
  }

  async findCategoryBySlug(slug: string): Promise<CategoryItem | null> {
    const cat = await this.prisma.category.findUnique({ where: { slug } });
    return cat
      ? {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          description: cat.description ?? null,
        }
      : null;
  }

  async createCategory(input: {
    name: string;
    slug: string;
    icon: string;
    description: string | null;
  }): Promise<CategoryItem> {
    const existing = await this.prisma.category.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictError("اسلاگ این دسته‌بندی تکراری است.");
    }
    const created = await this.prisma.category.create({
      data: input,
    });
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      icon: created.icon,
      description: created.description ?? null,
    };
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
    const updated = await this.prisma.category.update({
      where: { id },
      data: input,
    });
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      icon: updated.icon,
      description: updated.description ?? null,
    };
  }

  async deleteCategory(id: string): Promise<void> {
    const coursesCount = await this.prisma.course.count({
      where: { categoryId: id },
    });
    if (coursesCount > 0) {
      throw new ConflictError(
        "این دسته‌بندی دارای دوره فعال است و ابتدا باید دوره‌های آن منتقل یا حذف شوند."
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }

  async listCourses(
    filter: CourseListFilter
  ): Promise<{ courses: CourseSummary[]; total: number }> {
    const where: Prisma.CourseWhereInput = {};
    if (!filter.includeUnpublished) where.isPublished = true;
    if (filter.featured) where.isFeatured = true;
    if (filter.instructorId) where.instructorId = filter.instructorId;
    if (filter.level) where.level = filter.level;
    if (filter.categorySlug) {
      where.category = { slug: filter.categorySlug };
    }
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: "insensitive" } },
        { shortDesc: { contains: filter.q, mode: "insensitive" } },
        { instructorName: { contains: filter.q, mode: "insensitive" } },
      ];
    }
    if (filter.price === "free") {
      where.OR = [
        ...(where.OR || []),
      ];
      where.AND = [
        {
          OR: [{ discountPrice: 0 }, { discountPrice: null, price: 0 }],
        },
      ];
    } else if (filter.price === "paid") {
      where.AND = [
        {
          OR: [
            { discountPrice: { gt: 0 } },
            { discountPrice: null, price: { gt: 0 } },
          ],
        },
      ];
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: "desc" };
    if (filter.sort === "popular") orderBy = { studentsCount: "desc" };
    else if (filter.sort === "cheapest") orderBy = { price: "asc" };
    else if (filter.sort === "highest_rated") orderBy = { rating: "desc" };

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));

    const [total, rows] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
    ]);

    return {
      courses: rows.map(mapCourseSummary),
      total,
    };
  }

  async searchCourses(q: string, limit = 6): Promise<CourseSummary[]> {
    const rows = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { shortDesc: { contains: q, mode: "insensitive" } },
          { instructorName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { studentsCount: "desc" },
      include: { category: true },
    });
    return rows.map(mapCourseSummary);
  }

  async findCourseById(id: string): Promise<CourseEntity | null> {
    const row = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        chapters: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
              include: { attachments: true },
            },
          },
        },
      },
    });
    return row ? mapCourseEntity(row) : null;
  }

  async findCourseBySlugOrId(slugOrId: string): Promise<CourseEntity | null> {
    const row = await this.prisma.course.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: {
        category: true,
        chapters: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              orderBy: { position: "asc" },
              include: { attachments: true },
            },
          },
        },
      },
    });
    return row ? mapCourseEntity(row) : null;
  }

  async createCourse(input: CourseInput): Promise<CourseSummary> {
    const baseSlug = generateSlug(input.slug?.trim() || input.title) || "course";
    const existingSlug = await this.prisma.course.findUnique({
      where: { slug: baseSlug },
    });
    const slug = existingSlug
      ? `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
      : baseSlug;

    const created = await this.prisma.course.create({
      data: {
        title: input.title.trim(),
        slug,
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
        isPublished: input.isPublished,
        isFeatured: input.isFeatured,
        categoryId: input.categoryId,
        chapters: {
          create: (input.chapters || []).map((ch, cIdx) => ({
            title: ch.title.trim(),
            position: ch.position ?? cIdx + 1,
            lessons: {
              create: (ch.lessons || []).map((les, lIdx) => ({
                title: les.title.trim(),
                duration: les.duration.trim(),
                videoUrl: les.videoUrl.trim(),
                isFree: Boolean(les.isFree),
                position: les.position ?? lIdx + 1,
                summary: les.summary?.trim() || "",
                codeSnippet: les.codeSnippet?.trim() || "",
              })),
            },
          })),
        },
      },
      include: { category: true },
    });
    return mapCourseSummary(created);
  }

  async updateCourse(
    id: string,
    input: Partial<CourseInput>
  ): Promise<CourseSummary> {
    const existing = await this.prisma.course.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("دوره یافت نشد.");

    const updated = await this.prisma.$transaction(async (tx) => {
      if (Array.isArray(input.chapters)) {
        await tx.chapter.deleteMany({ where: { courseId: id } });
      }
      return tx.course.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.slug !== undefined && input.slug.trim()
            ? { slug: generateSlug(input.slug) || existing.slug }
            : {}),
          ...(input.shortDesc !== undefined
            ? { shortDesc: input.shortDesc.trim() }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description.trim() }
            : {}),
          ...(input.thumbnail !== undefined
            ? { thumbnail: input.thumbnail.trim() }
            : {}),
          ...(input.previewVideoUrl !== undefined
            ? { previewVideoUrl: input.previewVideoUrl.trim() }
            : {}),
          ...(input.price !== undefined ? { price: Math.max(0, input.price) } : {}),
          ...(input.discountPrice !== undefined
            ? { discountPrice: input.discountPrice }
            : {}),
          ...(input.level !== undefined ? { level: input.level } : {}),
          ...(input.duration !== undefined
            ? { duration: input.duration.trim() }
            : {}),
          ...(input.prerequisites !== undefined
            ? { prerequisites: input.prerequisites.trim() }
            : {}),
          ...(input.instructorName !== undefined
            ? { instructorName: input.instructorName.trim() }
            : {}),
          ...(input.instructorTitle !== undefined
            ? { instructorTitle: input.instructorTitle.trim() }
            : {}),
          ...(input.instructorBio !== undefined
            ? { instructorBio: input.instructorBio.trim() }
            : {}),
          ...(input.categoryId !== undefined
            ? { categoryId: input.categoryId }
            : {}),
          ...(input.isPublished !== undefined
            ? { isPublished: input.isPublished }
            : {}),
          ...(input.isFeatured !== undefined
            ? { isFeatured: input.isFeatured }
            : {}),
          ...(Array.isArray(input.chapters)
            ? {
                chapters: {
                  create: input.chapters.map((ch, cIdx) => ({
                    title: ch.title.trim(),
                    position: ch.position ?? cIdx + 1,
                    lessons: {
                      create: (ch.lessons || []).map((les, lIdx) => ({
                        title: les.title.trim(),
                        duration: les.duration.trim(),
                        videoUrl: les.videoUrl.trim(),
                        isFree: Boolean(les.isFree),
                        position: les.position ?? lIdx + 1,
                        summary: les.summary?.trim() || "",
                        codeSnippet: les.codeSnippet?.trim() || "",
                      })),
                    },
                  })),
                },
              }
            : {}),
        },
        include: { category: true },
      });
    });

    return mapCourseSummary(updated);
  }

  async setCoursePublished(
    id: string,
    isPublished: boolean
  ): Promise<CourseSummary> {
    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublished },
      include: { category: true },
    });
    return mapCourseSummary(updated);
  }

  async duplicateCourse(id: string): Promise<CourseSummary> {
    const existing = await this.findCourseById(id);
    if (!existing) throw new NotFoundError("دوره مورد نظر یافت نشد.");
    return this.createCourse({
      title: `${existing.title} (کپی)`,
      slug: `${existing.slug}-copy-${Date.now().toString().slice(-4)}`,
      shortDesc: existing.shortDesc,
      description: existing.description,
      thumbnail: existing.thumbnail,
      previewVideoUrl: existing.previewVideoUrl,
      price: existing.price,
      discountPrice: existing.discountPrice,
      level: existing.level,
      duration: existing.duration,
      prerequisites: existing.prerequisites,
      language: existing.language,
      instructorId: existing.instructorId,
      instructorName: existing.instructorName,
      instructorTitle: existing.instructorTitle,
      instructorBio: existing.instructorBio,
      isPublished: false,
      isFeatured: false,
      categoryId: existing.categoryId,
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
    await this.prisma.course.delete({ where: { id } });
  }

  async findLessonWithCourse(
    lessonId: string
  ): Promise<{ lesson: LessonEntity; course: CourseEntity } | null> {
    const row = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        attachments: true,
        chapter: {
          include: {
            course: {
              include: {
                category: true,
                chapters: {
                  include: {
                    lessons: { include: { attachments: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!row) return null;
    const course = mapCourseEntity(row.chapter.course);
    const lesson: LessonEntity = {
      id: row.id,
      chapterId: row.chapterId,
      title: row.title,
      duration: row.duration,
      videoUrl: row.videoUrl,
      isFree: row.isFree,
      position: row.position,
      summary: row.summary,
      codeSnippet: row.codeSnippet,
      attachments: row.attachments.map((att) => ({
        id: att.id,
        lessonId: att.lessonId,
        title: att.title,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
        createdAt: att.createdAt.toISOString(),
      })),
    };
    return { lesson, course };
  }

  async addChapter(
    courseId: string,
    input: { title: string; position?: number }
  ): Promise<ChapterEntity> {
    const count = await this.prisma.chapter.count({ where: { courseId } });
    const created = await this.prisma.chapter.create({
      data: {
        courseId,
        title: input.title.trim(),
        position: input.position ?? count + 1,
      },
    });
    return {
      id: created.id,
      courseId: created.courseId,
      title: created.title,
      position: created.position,
      lessons: [],
    };
  }

  async updateChapter(
    chapterId: string,
    input: { title?: string; position?: number }
  ): Promise<ChapterEntity> {
    const updated = await this.prisma.chapter.update({
      where: { id: chapterId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
      include: { lessons: true },
    });
    return {
      id: updated.id,
      courseId: updated.courseId,
      title: updated.title,
      position: updated.position,
      lessons: updated.lessons.map((l) => ({
        id: l.id,
        chapterId: l.chapterId,
        title: l.title,
        duration: l.duration,
        videoUrl: l.videoUrl,
        isFree: l.isFree,
        position: l.position,
        summary: l.summary,
        codeSnippet: l.codeSnippet,
      })),
    };
  }

  async deleteChapter(chapterId: string): Promise<void> {
    await this.prisma.chapter.delete({ where: { id: chapterId } });
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
    const count = await this.prisma.lesson.count({ where: { chapterId } });
    const created = await this.prisma.lesson.create({
      data: {
        chapterId,
        title: input.title.trim(),
        duration: input.duration.trim(),
        videoUrl: input.videoUrl.trim(),
        isFree: input.isFree,
        position: input.position ?? count + 1,
        summary: input.summary?.trim() || "",
        codeSnippet: input.codeSnippet?.trim() || "",
      },
    });
    return {
      id: created.id,
      chapterId: created.chapterId,
      title: created.title,
      duration: created.duration,
      videoUrl: created.videoUrl,
      isFree: created.isFree,
      position: created.position,
      summary: created.summary,
      codeSnippet: created.codeSnippet,
      attachments: [],
    };
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
    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: input,
      include: { attachments: true },
    });
    return {
      id: updated.id,
      chapterId: updated.chapterId,
      title: updated.title,
      duration: updated.duration,
      videoUrl: updated.videoUrl,
      isFree: updated.isFree,
      position: updated.position,
      summary: updated.summary,
      codeSnippet: updated.codeSnippet,
      attachments: updated.attachments.map((att) => ({
        id: att.id,
        lessonId: att.lessonId,
        title: att.title,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileSize: att.fileSize,
        createdAt: att.createdAt.toISOString(),
      })),
    };
  }

  async deleteLesson(lessonId: string): Promise<void> {
    await this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  async addLessonAttachment(input: {
    lessonId: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }): Promise<AttachmentEntity> {
    const created = await this.prisma.lessonAttachment.create({
      data: input,
    });
    return {
      id: created.id,
      lessonId: created.lessonId,
      title: created.title,
      fileUrl: created.fileUrl,
      fileType: created.fileType,
      fileSize: created.fileSize,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async deleteLessonAttachment(id: string): Promise<void> {
    await this.prisma.lessonAttachment.delete({ where: { id } });
  }

  async getEnrolledCourseIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    return rows.map((r) => r.courseId);
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const row = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return Boolean(row);
  }

  async getStudentEnrolledCourses(userId: string) {
    const rows = await this.prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          include: {
            category: true,
            chapters: {
              include: { lessons: { select: { id: true } } },
            },
          },
        },
      },
    });
    return rows.map((e) => ({
      ...mapCourseSummary(e.course),
      chaptersCount: e.course.chapters.length,
      lessonsCount: e.course.chapters.reduce(
        (sum, ch) => sum + ch.lessons.length,
        0
      ),
      progressPercent: e.progressPercent,
    }));
  }

  async createEnrollment(input: {
    userId: string;
    courseId: string;
    orderId?: string | null;
  }): Promise<{ created: boolean }> {
    const exists = await this.isUserEnrolled(input.userId, input.courseId);
    if (exists) return { created: false };

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          orderId: input.orderId ?? null,
        },
      });
      await tx.course.update({
        where: { id: input.courseId },
        data: { studentsCount: { increment: 1 } },
      });
    });
    return { created: true };
  }

  async deleteEnrollment(userId: string, courseId: string): Promise<void> {
    await this.prisma.enrollment.delete({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async findCouponByCode(code: string): Promise<DiscountCodeItem | null> {
    const c = await this.prisma.discountCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!c) return null;
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async listCoupons(): Promise<DiscountCodeItem[]> {
    const rows = await this.prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async createCoupon(input: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<DiscountCodeItem> {
    const cleanCode = input.code.trim().toUpperCase();
    const existing = await this.prisma.discountCode.findUnique({
      where: { code: cleanCode },
    });
    if (existing) throw new ConflictError("این کد تخفیف قبلاً ثبت شده است.");
    const c = await this.prisma.discountCode.create({
      data: {
        code: cleanCode,
        type: input.type,
        value: input.value,
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      },
    });
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async updateCouponStatus(
    id: string,
    isActive: boolean
  ): Promise<DiscountCodeItem> {
    const c = await this.prisma.discountCode.update({
      where: { id },
      data: { isActive },
    });
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    };
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.prisma.discountCode.delete({ where: { id } });
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
    const created = await this.prisma.order.create({
      data: {
        orderNumber: input.orderNumber,
        userId: input.userId,
        totalAmount: input.totalAmount,
        discountAmount: input.discountAmount,
        finalAmount: input.finalAmount,
        couponCode: input.couponCode,
        discountCodeId: input.discountCodeId,
        status: "PENDING",
        items: {
          create: input.items.map((i) => ({
            courseId: i.courseId,
            price: i.price,
          })),
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { course: true } },
      },
    });
    return mapOrderRecord(created);
  }

  async findOrderById(orderId: string): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { course: true } },
      },
    });
    return row ? mapOrderRecord(row) : null;
  }

  async findOrderByAuthority(authority: string): Promise<{
    order: OrderRecord;
    transaction: PaymentTransactionEntity;
  } | null> {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { authority },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { course: true } },
          },
        },
      },
    });
    if (!tx) return null;
    return {
      order: mapOrderRecord(tx.order),
      transaction: {
        id: tx.id,
        orderId: tx.orderId,
        gateway: tx.gateway,
        authority: tx.authority,
        refId: tx.refId,
        amount: tx.amount,
        status: tx.status as PaymentStatus,
        rawResponse: tx.rawResponse,
        verifiedAt: tx.verifiedAt ? tx.verifiedAt.toISOString() : null,
        createdAt: tx.createdAt.toISOString(),
      },
    };
  }

  async createPaymentTransaction(input: {
    orderId: string;
    gateway: string;
    authority: string | null;
    amount: number;
    status: PaymentStatus;
    rawResponse?: unknown;
  }): Promise<PaymentTransactionEntity> {
    const created = await this.prisma.paymentTransaction.create({
      data: {
        orderId: input.orderId,
        gateway: input.gateway,
        authority: input.authority,
        amount: input.amount,
        status: input.status,
        rawResponse: input.rawResponse as Prisma.InputJsonValue | undefined,
      },
    });
    return {
      id: created.id,
      orderId: created.orderId,
      gateway: created.gateway,
      authority: created.authority,
      refId: created.refId,
      amount: created.amount,
      status: created.status as PaymentStatus,
      rawResponse: created.rawResponse,
      verifiedAt: created.verifiedAt ? created.verifiedAt.toISOString() : null,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async completeOrderPayment(input: {
    orderId: string;
    paymentRef: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<{ order: OrderRecord; enrolledCourseIds: string[] }> {
    return this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: input.orderId },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { course: true } },
        },
      });
      if (!existingOrder) throw new NotFoundError("سفارش یافت نشد.");

      if (existingOrder.status === "COMPLETED") {
        return {
          order: mapOrderRecord(existingOrder),
          enrolledCourseIds: existingOrder.items.map((i) => i.courseId),
        };
      }

      const updatedOrder = await tx.order.update({
        where: { id: input.orderId },
        data: {
          status: "COMPLETED",
          paymentRef: input.paymentRef,
        },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { course: true } },
        },
      });

      if (input.authority) {
        await tx.paymentTransaction.updateMany({
          where: { authority: input.authority, orderId: input.orderId },
          data: {
            status: "VERIFIED",
            refId: input.paymentRef,
            verifiedAt: new Date(),
            rawResponse: input.rawResponse as Prisma.InputJsonValue | undefined,
          },
        });
      }

      if (updatedOrder.discountCodeId) {
        await tx.discountCode.update({
          where: { id: updatedOrder.discountCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const enrolledCourseIds: string[] = [];
      for (const item of updatedOrder.items) {
        const exists = await tx.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: updatedOrder.userId,
              courseId: item.courseId,
            },
          },
        });
        if (!exists) {
          await tx.enrollment.create({
            data: {
              userId: updatedOrder.userId,
              courseId: item.courseId,
              orderId: updatedOrder.id,
            },
          });
          await tx.course.update({
            where: { id: item.courseId },
            data: { studentsCount: { increment: 1 } },
          });
        }
        enrolledCourseIds.push(item.courseId);
      }

      return {
        order: mapOrderRecord(updatedOrder),
        enrolledCourseIds,
      };
    });
  }

  async failOrderPayment(input: {
    orderId: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { id: input.orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
      if (input.authority) {
        await tx.paymentTransaction.updateMany({
          where: { authority: input.authority, orderId: input.orderId },
          data: {
            status: "FAILED",
            rawResponse: input.rawResponse as Prisma.InputJsonValue | undefined,
          },
        });
      }
    });
  }

  async listUserOrders(userId: string): Promise<OrderRecord[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { course: true } },
      },
    });
    return rows.map(mapOrderRecord);
  }

  async listAdminOrders(filter: {
    status?: OrderStatus;
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ orders: OrderRecord[]; total: number }> {
    const where: Prisma.OrderWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.q) {
      where.OR = [
        { orderNumber: { contains: filter.q, mode: "insensitive" } },
        { user: { name: { contains: filter.q, mode: "insensitive" } } },
        { user: { email: { contains: filter.q, mode: "insensitive" } } },
      ];
    }
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { course: true } },
        },
      }),
    ]);
    return { total, orders: rows.map(mapOrderRecord) };
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<OrderRecord> {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { course: true } },
      },
    });
    return mapOrderRecord(updated);
  }

  private async recalculateCourseRating(courseId: string): Promise<number> {
    const agg = await this.prisma.review.aggregate({
      where: { courseId, status: "APPROVED" },
      _avg: { rating: true },
    });
    const avg = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 5.0;
    await this.prisma.course.update({
      where: { id: courseId },
      data: { rating: avg },
    });
    return avg;
  }

  async listCourseReviews(
    courseId: string,
    includeAllStatuses = false
  ): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany({
      where: {
        courseId,
        ...(includeAllStatuses ? {} : { status: "APPROVED" }),
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });
    return rows.map(mapReviewEntity);
  }

  async findReviewById(id: string): Promise<ReviewEntity | null> {
    const row = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });
    return row ? mapReviewEntity(row) : null;
  }

  async createReview(input: {
    courseId: string;
    userId: string;
    rating: number;
    comment: string;
    status?: ReviewStatus;
  }): Promise<{ review: ReviewEntity; courseRating: number }> {
    const duplicate = await this.prisma.review.findUnique({
      where: {
        userId_courseId: { userId: input.userId, courseId: input.courseId },
      },
    });
    if (duplicate) {
      throw new ConflictError(
        "شما قبلاً برای این دوره دیدگاه ثبت کرده‌اید. می‌توانید دیدگاه قبلی خود را ویرایش کنید."
      );
    }

    const created = await this.prisma.review.create({
      data: {
        courseId: input.courseId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment.trim(),
        status: input.status ?? "APPROVED",
      },
      include: { user: { select: { name: true } } },
    });
    const courseRating = await this.recalculateCourseRating(input.courseId);
    return { review: mapReviewEntity(created), courseRating };
  }

  async updateReview(
    id: string,
    input: { rating?: number; comment?: string }
  ): Promise<{ review: ReviewEntity; courseRating: number }> {
    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.comment !== undefined ? { comment: input.comment.trim() } : {}),
      },
      include: { user: { select: { name: true } } },
    });
    const courseRating = await this.recalculateCourseRating(updated.courseId);
    return { review: mapReviewEntity(updated), courseRating };
  }

  async moderateReview(
    id: string,
    status: ReviewStatus
  ): Promise<{ review: ReviewEntity; courseRating: number }> {
    const updated = await this.prisma.review.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    });
    const courseRating = await this.recalculateCourseRating(updated.courseId);
    return { review: mapReviewEntity(updated), courseRating };
  }

  async deleteReview(id: string): Promise<{ courseRating: number }> {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("دیدگاه یافت نشد.");
    await this.prisma.review.delete({ where: { id } });
    const courseRating = await this.recalculateCourseRating(existing.courseId);
    return { courseRating };
  }

  async listAdminReviews(filter: {
    status?: ReviewStatus;
    page: number;
    limit: number;
  }): Promise<{ reviews: ReviewEntity[]; total: number }> {
    const where: Prisma.ReviewWhereInput = filter.status
      ? { status: filter.status }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: {
          user: { select: { name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);
    return { total, reviews: rows.map(mapReviewEntity) };
  }

  async listUserNotifications(
    userId: string,
    limit = 30
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number }> {
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);
    return {
      unreadCount,
      notifications: rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type as NotificationType,
        isRead: n.isRead,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
  }): Promise<NotificationEntity> {
    const n = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        link: input.link ?? null,
      },
    });
    return {
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type as NotificationType,
      isRead: n.isRead,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    };
  }

  async broadcastNotification(input: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
    targetRole?: UserRole;
  }): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(input.targetRole ? { role: input.targetRole } : {}),
      },
      select: { id: true },
    });
    if (users.length === 0) return 0;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: input.title,
        message: input.message,
        type: input.type,
        link: input.link ?? null,
      })),
    });
    return users.length;
  }

  async markNotificationRead(userId: string, id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getAdminOverview(): Promise<{
    stats: AdminOverviewStats;
    recentOrders: OrderRecord[];
    recentRegistrations: PublicUser[];
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalOrdersCount,
      completedOrdersCount,
      totalRevenueAgg,
      monthlyRevenueAgg,
      totalEnrollments,
      pendingReviewsCount,
      recentOrdersRows,
      recentUsersRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: "STUDENT" } }),
      this.prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: "COMPLETED" } }),
      this.prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
        _sum: { finalAmount: true },
      }),
      this.prisma.enrollment.count(),
      this.prisma.review.count({ where: { status: "PENDING" } }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { include: { course: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        totalOrdersCount,
        completedOrdersCount,
        totalRevenue: totalRevenueAgg._sum.finalAmount ?? 0,
        monthlyRevenue: monthlyRevenueAgg._sum.finalAmount ?? 0,
        totalEnrollments,
        pendingReviewsCount,
      },
      recentOrders: recentOrdersRows.map(mapOrderRecord),
      recentRegistrations: recentUsersRows.map(mapPublicUser),
    };
  }

  async getInstructorOverview(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
    const courseIds = courses.map((c) => c.id);
    const revenueAgg = courseIds.length
      ? await this.prisma.orderItem.aggregate({
          where: {
            courseId: { in: courseIds },
            order: { status: "COMPLETED" },
          },
          _sum: { price: true },
        })
      : { _sum: { price: 0 } };

    const totalStudents = courses.reduce((s, c) => s + c.studentsCount, 0);
    const averageRating = courses.length
      ? Number(
          (
            courses.reduce((s, c) => s + c.rating, 0) / courses.length
          ).toFixed(1)
        )
      : 5.0;

    return {
      stats: {
        coursesCount: courses.length,
        publishedCoursesCount: courses.filter((c) => c.isPublished).length,
        totalStudents,
        totalRevenue: revenueAgg._sum.price ?? 0,
        averageRating,
      },
      courses: courses.map(mapCourseSummary),
    };
  }
}
