import type { Prisma, PrismaClient } from "@prisma/client";
import { getSeedData } from "./seedData";

export async function seedDatabaseIfEmpty(
  prisma: PrismaClient,
  options: { forceLog?: boolean } = {}
): Promise<{ seeded: boolean }> {
  const [userCount, categoryCount, courseCount] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.course.count(),
  ]);

  if (userCount > 0 && categoryCount > 0 && courseCount > 0) {
    if (options.forceLog) {
      console.log(
        `Database already initialized (${userCount} users, ${categoryCount} categories, ${courseCount} courses). Skipping seed.`
      );
    }
    return { seeded: false };
  }

  const seed = getSeedData();

  // 1. Platform Settings (never overwrite existing customized settings)
  await prisma.platformSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      data: seed.settings as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });

  // 2. Users (Admin, Instructor, Student) - preserve existing user data & passwords
  const userIdBySeedId = new Map<string, string>();
  for (const user of seed.users) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });
    if (existingByEmail) {
      userIdBySeedId.set(user.id, existingByEmail.id);
      continue;
    }

    const created = await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        passwordHash: user.passwordHash,
        isEmailVerified: user.isEmailVerified,
      },
      update: {},
      select: { id: true },
    });
    userIdBySeedId.set(user.id, created.id);
  }

  // 3. Categories - preserve existing category customizations and map IDs by slug
  const categoryIdBySeedId = new Map<string, string>();
  for (const cat of seed.categories) {
    const existingBySlug = await prisma.category.findUnique({
      where: { slug: cat.slug },
      select: { id: true },
    });
    if (existingBySlug) {
      categoryIdBySeedId.set(cat.id, existingBySlug.id);
      continue;
    }

    const created = await prisma.category.upsert({
      where: { id: cat.id },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
      },
      update: {},
      select: { id: true },
    });
    categoryIdBySeedId.set(cat.id, created.id);
  }

  // 4. Courses, Chapters & Lessons (seed only when catalog is empty or course slug missing)
  const courseIdBySeedId = new Map<string, string>();
  for (const course of seed.courses) {
    const existingBySlug = await prisma.course.findUnique({
      where: { slug: course.slug! },
      select: { id: true },
    });
    if (existingBySlug) {
      courseIdBySeedId.set(course.id, existingBySlug.id);
      continue;
    }

    const resolvedCategoryId =
      categoryIdBySeedId.get(course.categoryId) || course.categoryId;
    const resolvedInstructorId = course.instructorId
      ? userIdBySeedId.get(course.instructorId) ?? course.instructorId
      : null;

    const created = await prisma.course.create({
      data: {
        id: course.id,
        title: course.title,
        slug: course.slug!,
        shortDesc: course.shortDesc,
        description: course.description,
        thumbnail: course.thumbnail,
        previewVideoUrl: course.previewVideoUrl || "",
        price: course.price,
        discountPrice: course.discountPrice,
        level: course.level,
        duration: course.duration,
        prerequisites: course.prerequisites,
        language: course.language || "فارسی",
        instructorId: resolvedInstructorId,
        instructorName: course.instructorName,
        instructorTitle: course.instructorTitle,
        instructorBio: course.instructorBio || "",
        studentsCount: course.studentsCount,
        rating: course.rating,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        categoryId: resolvedCategoryId,
        chapters: {
          create: course.chapters.map((ch, cIdx) => ({
            id: ch.id,
            title: ch.title,
            position: ch.position ?? cIdx + 1,
            lessons: {
              create: ch.lessons.map((les, lIdx) => ({
                id: les.id,
                title: les.title,
                duration: les.duration,
                videoUrl: les.videoUrl || "",
                isFree: les.isFree,
                position: les.position ?? lIdx + 1,
                summary: les.summary || "",
                codeSnippet: les.codeSnippet || "",
              })),
            },
          })),
        },
      },
      select: { id: true },
    });
    courseIdBySeedId.set(course.id, created.id);
  }

  // 5. Coupons (never overwrite existing coupon counts or active flags)
  for (const cpn of seed.discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: cpn.code },
      create: {
        id: cpn.id,
        code: cpn.code,
        type: cpn.type,
        value: cpn.value,
        maxUses: cpn.maxUses,
        usedCount: cpn.usedCount,
        expiresAt: cpn.expiresAt ? new Date(cpn.expiresAt) : null,
        isActive: cpn.isActive,
      },
      update: {},
    });
  }

  // 6. Seed Reviews (only when review table is empty and user/course exist)
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    for (const rev of seed.reviews) {
      const resolvedUserId = userIdBySeedId.get(rev.userId);
      const resolvedCourseId = courseIdBySeedId.get(rev.courseId);
      if (!resolvedUserId || !resolvedCourseId) continue;

      await prisma.review.upsert({
        where: {
          userId_courseId: {
            userId: resolvedUserId,
            courseId: resolvedCourseId,
          },
        },
        create: {
          id: rev.id,
          userId: resolvedUserId,
          courseId: resolvedCourseId,
          rating: rev.rating,
          comment: rev.comment,
          status: rev.status,
        },
        update: {},
      });
    }
  }

  if (options.forceLog) {
    console.log("Database seed completed successfully.");
  }
  return { seeded: true };
}
