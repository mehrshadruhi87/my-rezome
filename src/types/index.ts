export type UserRole = "ADMIN" | "STUDENT";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type OrderStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  bio: string | null;
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

export interface LessonItem {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  isFree: boolean;
  position: number;
  summary?: string;
  codeSnippet?: string;
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
  userId: string;
  userName: string;
  courseId: string;
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
  level: CourseLevel;
  duration: string;
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
