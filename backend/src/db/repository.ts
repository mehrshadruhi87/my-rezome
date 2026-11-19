import type {
  CategoryItem,
  CourseDetail,
  CourseLevel,
  CourseSummary,
  DiscountCodeItem,
  DiscountType,
  OrderRecord,
  OrderStatus,
  PlatformSettings,
  PublicUser,
} from "../../../src/types";

export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PaymentStatus = "INITIATED" | "VERIFIED" | "FAILED";
export type VerificationPurpose =
  | "EMAIL_VERIFY"
  | "PHONE_VERIFY"
  | "PASSWORD_RESET";
export type NotificationType =
  | "SYSTEM"
  | "ORDER"
  | "COURSE"
  | "REVIEW"
  | "AUTH";

export interface UserEntity extends PublicUser {
  passwordHash: string;
  role: UserRole;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface SessionEntity {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface VerificationTokenEntity {
  id: string;
  userId: string;
  purpose: VerificationPurpose;
  target: string;
  codeHash: string;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface AttachmentEntity {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface LessonEntity {
  id: string;
  chapterId: string;
  title: string;
  duration: string;
  videoUrl: string;
  isFree: boolean;
  position: number;
  summary: string;
  codeSnippet: string;
  attachments?: AttachmentEntity[];
}

export interface ChapterEntity {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: LessonEntity[];
}

export interface CourseEntity {
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
  instructorId: string | null;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  studentsCount: number;
  rating: number;
  isPublished: boolean;
  isFeatured: boolean;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  chapters: ChapterEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEntity {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  courseTitle?: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransactionEntity {
  id: string;
  orderId: string;
  gateway: string;
  authority: string | null;
  refId: string | null;
  amount: number;
  status: PaymentStatus;
  rawResponse?: unknown;
  verifiedAt: string | null;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface CourseListFilter {
  categorySlug?: string;
  level?: CourseLevel;
  price?: "free" | "paid";
  sort?: "newest" | "popular" | "cheapest" | "highest_rated";
  q?: string;
  featured?: boolean;
  includeUnpublished?: boolean;
  instructorId?: string;
  page?: number;
  limit?: number;
}

export interface CourseInput {
  title: string;
  slug?: string;
  shortDesc: string;
  description: string;
  thumbnail: string;
  previewVideoUrl?: string;
  price: number;
  discountPrice: number | null;
  level: CourseLevel;
  duration: string;
  prerequisites: string;
  language?: string;
  instructorId?: string | null;
  instructorName: string;
  instructorTitle: string;
  instructorBio?: string;
  isPublished: boolean;
  isFeatured: boolean;
  categoryId: string;
  chapters: Array<{
    id?: string;
    title: string;
    position?: number;
    lessons: Array<{
      id?: string;
      title: string;
      duration: string;
      videoUrl: string;
      isFree: boolean;
      position?: number;
      summary?: string;
      codeSnippet?: string;
    }>;
  }>;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  publishedCourses: number;
  totalCourses: number;
  totalOrdersCount: number;
  completedOrdersCount: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalEnrollments: number;
  pendingReviewsCount: number;
}

export interface IRepository {
  // Health & Settings
  ping(): Promise<boolean>;
  ensureSeeded?(): Promise<void>;
  getSettings(): Promise<PlatformSettings>;
  updateSettings(settings: PlatformSettings): Promise<PlatformSettings>;

  // Users & Auth
  findUserById(id: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  createUser(input: {
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
    role: UserRole;
  }): Promise<UserEntity>;
  updateUserProfile(
    userId: string,
    input: { name: string; phone: string | null; bio: string | null; avatarUrl?: string | null }
  ): Promise<UserEntity>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  markUserVerified(
    userId: string,
    field: "email" | "phone"
  ): Promise<UserEntity>;
  listUsers(filter: {
    q?: string;
    role?: UserRole;
    page: number;
    limit: number;
  }): Promise<{
    users: Array<
      UserEntity & { enrolledCourseIds: string[]; ordersCount: number }
    >;
    total: number;
  }>;
  updateUserRole(userId: string, role: UserRole): Promise<UserEntity>;
  updateUserStatus(userId: string, isActive: boolean): Promise<UserEntity>;

  // Sessions
  createSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<SessionEntity>;
  findSessionById(id: string): Promise<SessionEntity | null>;
  findSessionByTokenHash(hash: string): Promise<SessionEntity | null>;
  rotateSessionToken(
    sessionId: string,
    nextRefreshTokenHash: string,
    nextExpiresAt: Date
  ): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
  listUserSessions(userId: string): Promise<SessionEntity[]>;

  // Verification / Password Reset Tokens
  createVerificationToken(input: {
    userId: string;
    purpose: VerificationPurpose;
    target: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<VerificationTokenEntity>;
  findValidVerificationToken(input: {
    userId?: string;
    target?: string;
    purpose: VerificationPurpose;
    codeHash: string;
  }): Promise<VerificationTokenEntity | null>;
  consumeVerificationToken(id: string): Promise<void>;

  // Categories
  listCategories(includeUnpublishedCount?: boolean): Promise<CategoryItem[]>;
  findCategoryById(id: string): Promise<CategoryItem | null>;
  findCategoryBySlug(slug: string): Promise<CategoryItem | null>;
  createCategory(input: {
    name: string;
    slug: string;
    icon: string;
    description: string | null;
  }): Promise<CategoryItem>;
  updateCategory(
    id: string,
    input: Partial<{
      name: string;
      slug: string;
      icon: string;
      description: string | null;
    }>
  ): Promise<CategoryItem>;
  deleteCategory(id: string): Promise<void>;

  // Courses, Chapters, Lessons, Attachments
  listCourses(
    filter: CourseListFilter
  ): Promise<{ courses: CourseSummary[]; total: number }>;
  searchCourses(q: string, limit?: number): Promise<CourseSummary[]>;
  findCourseById(id: string): Promise<CourseEntity | null>;
  findCourseBySlugOrId(slugOrId: string): Promise<CourseEntity | null>;
  createCourse(input: CourseInput): Promise<CourseSummary>;
  updateCourse(id: string, input: Partial<CourseInput>): Promise<CourseSummary>;
  setCoursePublished(id: string, isPublished: boolean): Promise<CourseSummary>;
  duplicateCourse(id: string): Promise<CourseSummary>;
  deleteCourse(id: string): Promise<void>;
  findLessonWithCourse(
    lessonId: string
  ): Promise<{ lesson: LessonEntity; course: CourseEntity } | null>;
  addChapter(
    courseId: string,
    input: { title: string; position?: number }
  ): Promise<ChapterEntity>;
  updateChapter(
    chapterId: string,
    input: { title?: string; position?: number }
  ): Promise<ChapterEntity>;
  deleteChapter(chapterId: string): Promise<void>;
  addLesson(
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
  ): Promise<LessonEntity>;
  updateLesson(
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
  ): Promise<LessonEntity>;
  deleteLesson(lessonId: string): Promise<void>;
  addLessonAttachment(input: {
    lessonId: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }): Promise<AttachmentEntity>;
  deleteLessonAttachment(id: string): Promise<void>;

  // Enrollments
  getEnrolledCourseIds(userId: string): Promise<string[]>;
  isUserEnrolled(userId: string, courseId: string): Promise<boolean>;
  getStudentEnrolledCourses(userId: string): Promise<
    Array<CourseSummary & { chaptersCount: number; lessonsCount: number; progressPercent: number }>
  >;
  createEnrollment(input: {
    userId: string;
    courseId: string;
    orderId?: string | null;
  }): Promise<{ created: boolean }>;
  deleteEnrollment(userId: string, courseId: string): Promise<void>;

  // Coupons
  findCouponByCode(code: string): Promise<DiscountCodeItem | null>;
  listCoupons(): Promise<DiscountCodeItem[]>;
  createCoupon(input: {
    code: string;
    type: DiscountType;
    value: number;
    maxUses: number;
    expiresAt: Date | null;
  }): Promise<DiscountCodeItem>;
  updateCouponStatus(id: string, isActive: boolean): Promise<DiscountCodeItem>;
  deleteCoupon(id: string): Promise<void>;

  // Orders & Transactions
  createPendingOrder(input: {
    orderNumber: string;
    userId: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    couponCode: string | null;
    discountCodeId: string | null;
    items: Array<{ courseId: string; price: number }>;
  }): Promise<OrderRecord>;
  findOrderById(orderId: string): Promise<OrderRecord | null>;
  findOrderByAuthority(authority: string): Promise<{
    order: OrderRecord;
    transaction: PaymentTransactionEntity;
  } | null>;
  createPaymentTransaction(input: {
    orderId: string;
    gateway: string;
    authority: string | null;
    amount: number;
    status: PaymentStatus;
    rawResponse?: unknown;
  }): Promise<PaymentTransactionEntity>;
  completeOrderPayment(input: {
    orderId: string;
    paymentRef: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<{ order: OrderRecord; enrolledCourseIds: string[] }>;
  failOrderPayment(input: {
    orderId: string;
    authority?: string | null;
    rawResponse?: unknown;
  }): Promise<void>;
  listUserOrders(userId: string): Promise<OrderRecord[]>;
  listAdminOrders(filter: {
    status?: OrderStatus;
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ orders: OrderRecord[]; total: number }>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderRecord>;

  // Reviews
  listCourseReviews(
    courseId: string,
    includeAllStatuses?: boolean
  ): Promise<ReviewEntity[]>;
  findReviewById(id: string): Promise<ReviewEntity | null>;
  createReview(input: {
    courseId: string;
    userId: string;
    rating: number;
    comment: string;
    status?: ReviewStatus;
  }): Promise<{ review: ReviewEntity; courseRating: number }>;
  updateReview(
    id: string,
    input: { rating?: number; comment?: string }
  ): Promise<{ review: ReviewEntity; courseRating: number }>;
  moderateReview(
    id: string,
    status: ReviewStatus
  ): Promise<{ review: ReviewEntity; courseRating: number }>;
  deleteReview(id: string): Promise<{ courseRating: number }>;
  listAdminReviews(filter: {
    status?: ReviewStatus;
    page: number;
    limit: number;
  }): Promise<{ reviews: ReviewEntity[]; total: number }>;

  // Notifications
  listUserNotifications(
    userId: string,
    limit?: number
  ): Promise<{ notifications: NotificationEntity[]; unreadCount: number }>;
  createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
  }): Promise<NotificationEntity>;
  broadcastNotification(input: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
    targetRole?: UserRole;
  }): Promise<number>;
  markNotificationRead(userId: string, id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Overview Analytics
  getAdminOverview(): Promise<{
    stats: AdminOverviewStats;
    recentOrders: OrderRecord[];
    recentRegistrations: PublicUser[];
  }>;
  getInstructorOverview(instructorId: string): Promise<{
    stats: {
      coursesCount: number;
      publishedCoursesCount: number;
      totalStudents: number;
      totalRevenue: number;
      averageRating: number;
    };
    courses: CourseSummary[];
  }>;
}
