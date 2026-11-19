export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type OrderStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type InstructorStatus = "pending" | "approved" | "rejected";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: UserRole;
  phone: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isActive?: boolean;
  instructorStatus?: InstructorStatus | null;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  coursesCount?: number;
}

export interface LessonAttachmentItem {
  id: string;
  lessonId?: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number | string;
  createdAt?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  isFree: boolean;
  position: number;
  summary?: string;
  codeSnippet?: string;
  attachments?: LessonAttachmentItem[];
}

export interface ChapterItem {
  id: string;
  title: string;
  position: number;
  lessons: LessonItem[];
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  userId: string;
  userName: string;
  authorRole?: UserRole;
  courseId: string;
  courseTitle?: string;
  createdAt: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  thumbnail: string;
  price: number;
  discountPrice: number | null;
  fullAccess?: boolean;
  instructorSharePercent?: number;
  instructorDiscountPercent?: number;
  level: CourseLevel;
  duration: string;
  instructorId?: string | null;
  instructorName: string;
  instructorTitle: string;
  studentsCount: number;
  rating: number;
  isPublished: boolean;
  isFeatured: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
}

export interface CourseDetail extends CourseSummary {
  description: string;
  previewVideoUrl: string;
  prerequisites: string;
  language: string;
  instructorBio: string;
  chapters: ChapterItem[];
  reviews: ReviewItem[];
  isEnrolled?: boolean;
}

export interface InstructorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  specialty: string;
  bio: string;
  status: InstructorStatus;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string;
  authorName: string;
  isPublished: boolean;
  createdAt: string;
}

export interface DiscountCodeItem {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItemRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string;
  price: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentRef: string | null;
  couponCode: string | null;
  items: OrderItemRecord[];
  createdAt: string;
}

export interface CartCourseItem {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  instructorName: string;
  price: number;
  discountPrice: number | null;
}

export interface AppliedCoupon {
  code: string;
  type: DiscountType;
  value: number;
}

export type ThemePaletteId =
  | "indigo_slate"
  | "emerald_obsidian"
  | "cyan_ocean"
  | "amber_carbon"
  | "rose_midnight";

export type SiteFontId =
  | "vazirmatn"
  | "rubik"
  | "readex_pro"
  | "noto_sans_arabic"
  | "noto_naskh_arabic";

export type RadiusPresetId = "sharp" | "default" | "rounded";

export interface PlatformSettings {
  themePalette: ThemePaletteId;
  fontFamily: SiteFontId;
  baseFontSize: number;
  headingScale: number;
  lineHeight: number;
  borderRadius: RadiusPresetId;

  brandPrimaryText: string;
  brandAccentText: string;
  siteTitle: string;
  footerTagline: string;
  copyrightText: string;

  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  featuredCoursesLimit: number;

  showAnnouncementBar: boolean;
  announcementText: string;
  announcementLink: string;

  showCategoriesSection: boolean;
  showRoadmapsSection: boolean;
  showTestimonialsSection: boolean;
  showTrustBadges: boolean;

  allowRegistration: boolean;
  allowCoupons: boolean;
  allowReviews: boolean;

  showDeveloperInfo: boolean;
  developerName: string;
  developerEmail: string;
  developerPhone: string;
  developerInstagram: string;
  developerTelegram: string;
}

