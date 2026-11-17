import express, { type Request, type Response } from "express";
import path from "node:path";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { readDb, writeDb, createId, type DbUser, type DbCourse } from "./server/db";
import {
  clearSessionCookie,
  getAuthenticatedUser,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSessionToken,
  toPublicUser,
} from "./server/auth";
import { generateSlug } from "./src/utils/formatters";
import {
  calculateCartTotals,
  validateDiscountEligibility,
} from "./src/utils/pricing";

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));

function serializeCourseSummary(course: DbCourse) {
  const db = readDb();
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

// --- HEALTH ---
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// --- BOOTSTRAP ---
app.get("/api/bootstrap", (req: Request, res: Response) => {
  const db = readDb();
  const user = getAuthenticatedUser(req);
  const categories = db.categories.map((cat) => ({
    ...cat,
    coursesCount: db.courses.filter(
      (c) => c.categoryId === cat.id && c.isPublished
    ).length,
  }));
  const enrolledCourseIds = user
    ? db.enrollments.filter((e) => e.userId === user.id).map((e) => e.courseId)
    : [];

  res.json({
    categories,
    user: user ? toPublicUser(user) : null,
    enrolledCourseIds,
  });
});

// --- AUTH ROUTES ---
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "لطفاً ایمیل و رمز عبور را وارد کنید." });
    return;
  }
  const db = readDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase().trim()
  );
  if (!user) {
    res.status(401).json({ error: "کاربری با این ایمیل یافت نشد." });
    return;
  }
  const valid = bcrypt.compareSync(String(password), user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "رمز عبور اشتباه است." });
    return;
  }
  const token = signSessionToken(user.id, user.role);
  setSessionCookie(res, token, req);
  const enrolledCourseIds = db.enrollments
    .filter((e) => e.userId === user.id)
    .map((e) => e.courseId);
  res.json({ user: toPublicUser(user), enrolledCourseIds, token });
});

app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password || String(password).length < 6) {
    res.status(400).json({
      error: "نام، ایمیل معتبر و رمز عبور حداقل ۶ کاراکتری الزامی است.",
    });
    return;
  }
  const db = readDb();
  const normalizedEmail = String(email).toLowerCase().trim();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است." });
    return;
  }
  const newUser: DbUser = {
    id: createId("usr"),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(String(password), 10),
    role: "STUDENT",
    phone: phone ? String(phone).trim() : null,
    bio: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeDb(db);

  const token = signSessionToken(newUser.id, newUser.role);
  setSessionCookie(res, token, req);
  res
    .status(201)
    .json({ user: toPublicUser(newUser), enrolledCourseIds: [], token });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.json({ user: null, enrolledCourseIds: [] });
    return;
  }
  const db = readDb();
  const enrolledCourseIds = db.enrollments
    .filter((e) => e.userId === user.id)
    .map((e) => e.courseId);
  res.json({ user: toPublicUser(user), enrolledCourseIds });
});

app.put("/api/profile", requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as Request & { currentUser: DbUser }).currentUser;
  const { name, phone, bio } = req.body ?? {};
  if (!name?.trim()) {
    res.status(400).json({ error: "نام و نام خانوادگی نمی‌تواند خالی باشد." });
    return;
  }
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === currentUser.id);
  if (idx === -1) {
    res.status(404).json({ error: "کاربر یافت نشد." });
    return;
  }
  db.users[idx] = {
    ...db.users[idx],
    name: String(name).trim(),
    phone: phone ? String(phone).trim() : null,
    bio: bio ? String(bio).trim() : null,
  };
  writeDb(db);
  res.json({ user: toPublicUser(db.users[idx]) });
});

// --- COURSES PUBLIC ROUTES ---
app.get("/api/courses/search", (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (q.length < 2) {
    res.json({ courses: [] });
    return;
  }
  const db = readDb();
  const matches = db.courses
    .filter(
      (c) =>
        c.isPublished &&
        (c.title.toLowerCase().includes(q) ||
          c.shortDesc.toLowerCase().includes(q) ||
          c.instructorName.toLowerCase().includes(q))
    )
    .slice(0, 6)
    .map(serializeCourseSummary);
  res.json({ courses: matches });
});

app.get("/api/courses", (req: Request, res: Response) => {
  const db = readDb();
  const categorySlug = String(req.query.category ?? "").trim();
  const level = String(req.query.level ?? "").trim();
  const priceType = String(req.query.price ?? "").trim();
  const sort = String(req.query.sort ?? "newest").trim();
  const q = String(req.query.q ?? "").trim().toLowerCase();
  const featured = req.query.featured === "true";
  const includeUnpublished = req.query.includeUnpublished === "true";

  const user = getAuthenticatedUser(req);
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

  res.json({ courses: filtered.map(serializeCourseSummary) });
});

app.get("/api/courses/:slug", (req: Request, res: Response) => {
  const db = readDb();
  const slugParam = decodeURIComponent(String(req.params.slug ?? ""));
  const user = getAuthenticatedUser(req);
  const course = db.courses.find(
    (c) => c.slug === slugParam || c.id === slugParam
  );
  if (!course || (!course.isPublished && user?.role !== "ADMIN")) {
    res.status(404).json({ error: "دوره مورد نظر یافت نشد." });
    return;
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

  const summary = serializeCourseSummary(course);
  res.json({
    course: {
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
          // Protect paid lesson content unless enrolled or free
          codeSnippet: les.isFree || isEnrolled ? les.codeSnippet : "",
        })),
      })),
      reviews,
      isEnrolled,
    },
  });
});

app.post(
  "/api/courses/:id/reviews",
  requireAuth,
  (req: Request, res: Response) => {
    const currentUser = (req as Request & { currentUser: DbUser }).currentUser;
    const { rating, comment } = req.body ?? {};
    if (!comment || !String(comment).trim()) {
      res.status(400).json({ error: "متن دیدگاه نمی‌تواند خالی باشد." });
      return;
    }

    const db = readDb();
    const courseIdx = db.courses.findIndex((c) => c.id === req.params.id);
    if (courseIdx === -1) {
      res.status(404).json({ error: "دوره یافت نشد." });
      return;
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
      courseReviews.reduce((sum, r) => sum + r.rating, 0) /
      courseReviews.length;
    db.courses[courseIdx].rating = Number(avg.toFixed(1));
    writeDb(db);

    res.status(201).json({
      review: { ...review, userName: currentUser.name },
      rating: db.courses[courseIdx].rating,
    });
  }
);

// --- COUPONS & CHECKOUT ---
app.post("/api/coupons/validate", (req: Request, res: Response) => {
  const code = String(req.body?.code ?? "").trim().toUpperCase();
  if (!code) {
    res.status(400).json({ error: "لطفاً کد تخفیف را وارد کنید." });
    return;
  }
  const db = readDb();
  const discount = db.discountCodes.find((d) => d.code === code);
  const check = validateDiscountEligibility(discount);
  if (!check.valid || !discount) {
    res.status(400).json({ error: check.valid ? "کد نامعتبر" : check.error });
    return;
  }
  res.json({
    coupon: {
      code: discount.code,
      type: discount.type,
      value: discount.value,
    },
  });
});

app.post(
  "/api/checkout/initiate",
  requireAuth,
  (req: Request, res: Response) => {
    const currentUser = (req as Request & { currentUser: DbUser }).currentUser;
    const { courseIds, couponCode } = req.body ?? {};
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ error: "سبد خرید شما خالی است." });
      return;
    }

    const db = readDb();
    const selectedCourses = db.courses.filter((c) =>
      courseIds.includes(c.id)
    );
    if (selectedCourses.length === 0) {
      res.status(404).json({ error: "دوره‌های انتخاب شده یافت نشدند." });
      return;
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
    const order = {
      id: createId("ord"),
      orderNumber,
      userId: currentUser.id,
      totalAmount: totals.subtotal,
      discountAmount: totals.subtotal - totals.finalTotal,
      finalAmount: totals.finalTotal,
      status: "PENDING" as const,
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
    writeDb(db);

    res.status(201).json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      finalAmount: order.finalAmount,
    });
  }
);

app.post(
  "/api/checkout/verify",
  requireAuth,
  (req: Request, res: Response) => {
    const currentUser = (req as Request & { currentUser: DbUser }).currentUser;
    const { orderId, status } = req.body ?? {};
    const db = readDb();
    const orderIdx = db.orders.findIndex(
      (o) => o.id === orderId && o.userId === currentUser.id
    );
    if (orderIdx === -1) {
      res.status(404).json({ error: "سفارش یافت نشد." });
      return;
    }

    const order = db.orders[orderIdx];
    if (order.status === "COMPLETED") {
      res.json({
        success: true,
        orderNumber: order.orderNumber,
        paymentRef: order.paymentRef,
      });
      return;
    }

    if (status === "FAILED") {
      db.orders[orderIdx].status = "FAILED";
      writeDb(db);
      res.json({ success: false, orderNumber: order.orderNumber });
      return;
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

    writeDb(db);
    res.json({
      success: true,
      orderNumber: order.orderNumber,
      paymentRef,
      enrolledCourseIds: newlyEnrolledCourseIds,
    });
  }
);

// --- STUDENT DASHBOARD ---
app.get("/api/student/dashboard", requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as Request & { currentUser: DbUser }).currentUser;
  const db = readDb();

  const enrolledIds = db.enrollments
    .filter((e) => e.userId === currentUser.id)
    .map((e) => e.courseId);

  const enrolledCourses = db.courses
    .filter((c) => enrolledIds.includes(c.id))
    .map((c) => ({
      ...serializeCourseSummary(c),
      chaptersCount: c.chapters.length,
      lessonsCount: c.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0),
    }));

  const orders = db.orders
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

  res.json({
    user: toPublicUser(currentUser),
    enrolledCourses,
    orders,
  });
});

// --- ADMIN ROUTES (RBAC) ---
app.get("/api/admin/overview", requireAdmin, (_req: Request, res: Response) => {
  const db = readDb();
  const completedOrders = db.orders.filter((o) => o.status === "COMPLETED");
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + o.finalAmount,
    0
  );
  const totalStudents = db.users.filter((u) => u.role === "STUDENT").length;
  const publishedCourses = db.courses.filter((c) => c.isPublished).length;
  const totalEnrollments = db.enrollments.length;

  const recentOrders = [...db.orders]
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
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

  res.json({
    stats: {
      totalRevenue,
      totalStudents,
      publishedCourses,
      totalCourses: db.courses.length,
      completedOrdersCount: completedOrders.length,
      totalEnrollments,
    },
    recentOrders,
  });
});

app.get("/api/admin/courses/:id", requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const course = db.courses.find((c) => c.id === req.params.id);
  if (!course) {
    res.status(404).json({ error: "دوره یافت نشد." });
    return;
  }
  res.json({ course });
});

app.post("/api/admin/courses", requireAdmin, (req: Request, res: Response) => {
  const body = req.body ?? {};
  if (!body.title?.trim() || !body.categoryId) {
    res.status(400).json({ error: "عنوان دوره و دسته‌بندی الزامی است." });
    return;
  }
  const db = readDb();
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
  writeDb(db);
  res.status(201).json({ course: serializeCourseSummary(newCourse) });
});

app.put("/api/admin/courses/:id", requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "دوره یافت نشد." });
    return;
  }

  const body = req.body ?? {};
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
    price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : existing.price,
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

  writeDb(db);
  res.json({ course: serializeCourseSummary(db.courses[idx]) });
});

app.post(
  "/api/admin/courses/:id/duplicate",
  requireAdmin,
  (req: Request, res: Response) => {
    const db = readDb();
    const existing = db.courses.find((c) => c.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: "دوره مورد نظر یافت نشد." });
      return;
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
    writeDb(db);
    res.status(201).json({ course: serializeCourseSummary(copy) });
  }
);

app.delete("/api/admin/courses/:id", requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  db.courses = db.courses.filter((c) => c.id !== req.params.id);
  db.enrollments = db.enrollments.filter((e) => e.courseId !== req.params.id);
  db.reviews = db.reviews.filter((r) => r.courseId !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

// --- ADMIN CATEGORIES ---
app.post("/api/admin/categories", requireAdmin, (req: Request, res: Response) => {
  const { name, slug, icon, description } = req.body ?? {};
  if (!name?.trim()) {
    res.status(400).json({ error: "نام دسته‌بندی الزامی است." });
    return;
  }
  const db = readDb();
  const cleanSlug = generateSlug(slug?.trim() || name) || createId("cat");
  if (db.categories.some((c) => c.slug === cleanSlug)) {
    res.status(409).json({ error: "اسلاگ این دسته‌بندی تکراری است." });
    return;
  }
  const cat = {
    id: createId("cat"),
    name: String(name).trim(),
    slug: cleanSlug,
    icon: String(icon || "Code2"),
    description: description ? String(description).trim() : null,
  };
  db.categories.push(cat);
  writeDb(db);
  res.status(201).json({ category: cat });
});

app.put("/api/admin/categories/:id", requireAdmin, (req: Request, res: Response) => {
  const { name, slug, icon, description } = req.body ?? {};
  const db = readDb();
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "دسته‌بندی یافت نشد." });
    return;
  }
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
  writeDb(db);
  res.json({ category: db.categories[idx] });
});

app.delete(
  "/api/admin/categories/:id",
  requireAdmin,
  (req: Request, res: Response) => {
    const db = readDb();
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  }
);

// --- ADMIN COUPONS ---
app.get("/api/admin/coupons", requireAdmin, (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ coupons: db.discountCodes });
});

app.post("/api/admin/coupons", requireAdmin, (req: Request, res: Response) => {
  const { code, type, value, maxUses, expiresAt } = req.body ?? {};
  const cleanCode = String(code ?? "").trim().toUpperCase();
  if (!cleanCode || Number(value) <= 0) {
    res.status(400).json({ error: "کد تخفیف و مقدار معتبر الزامی است." });
    return;
  }
  const db = readDb();
  if (db.discountCodes.some((d) => d.code === cleanCode)) {
    res.status(409).json({ error: "این کد تخفیف قبلاً ثبت شده است." });
    return;
  }
  const coupon = {
    id: createId("cpn"),
    code: cleanCode,
    type: type === "FIXED" ? ("FIXED" as const) : ("PERCENTAGE" as const),
    value: Number(value),
    maxUses: Math.max(1, Number(maxUses) || 100),
    usedCount: 0,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.discountCodes.unshift(coupon);
  writeDb(db);
  res.status(201).json({ coupon });
});

app.patch("/api/admin/coupons/:id", requireAdmin, (req: Request, res: Response) => {
  const db = readDb();
  const idx = db.discountCodes.findIndex((d) => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "کد تخفیف یافت نشد." });
    return;
  }
  db.discountCodes[idx].isActive = Boolean(req.body?.isActive);
  writeDb(db);
  res.json({ coupon: db.discountCodes[idx] });
});

app.delete(
  "/api/admin/coupons/:id",
  requireAdmin,
  (req: Request, res: Response) => {
    const db = readDb();
    db.discountCodes = db.discountCodes.filter((d) => d.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  }
);

// --- ADMIN USERS & ENROLLMENTS ---
app.get("/api/admin/users", requireAdmin, (_req: Request, res: Response) => {
  const db = readDb();
  const users = db.users.map((u) => ({
    ...toPublicUser(u),
    enrolledCourseIds: db.enrollments
      .filter((e) => e.userId === u.id)
      .map((e) => e.courseId),
    ordersCount: db.orders.filter((o) => o.userId === u.id).length,
  }));
  res.json({ users });
});

app.patch(
  "/api/admin/users/:id/role",
  requireAdmin,
  (req: Request, res: Response) => {
    const role = req.body?.role === "ADMIN" ? "ADMIN" : "STUDENT";
    const db = readDb();
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }
    db.users[idx].role = role;
    writeDb(db);
    res.json({ user: toPublicUser(db.users[idx]) });
  }
);

app.post("/api/admin/enrollments", requireAdmin, (req: Request, res: Response) => {
  const { userId, courseId } = req.body ?? {};
  const db = readDb();
  const exists = db.enrollments.some(
    (e) => e.userId === userId && e.courseId === courseId
  );
  if (exists) {
    res.status(409).json({ error: "این دانشجو قبلاً در این دوره ثبت‌نام شده است." });
    return;
  }
  const crsIdx = db.courses.findIndex((c) => c.id === courseId);
  if (crsIdx === -1) {
    res.status(404).json({ error: "دوره یافت نشد." });
    return;
  }
  db.enrollments.push({
    id: createId("enr"),
    userId: String(userId),
    courseId: String(courseId),
    createdAt: new Date().toISOString(),
  });
  db.courses[crsIdx].studentsCount += 1;
  writeDb(db);
  res.status(201).json({ ok: true });
});

async function startServer() {
  // Ensure database is initialized on boot
  readDb();

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeAcademy server running on http://localhost:${PORT}`);
  });
}

startServer();
