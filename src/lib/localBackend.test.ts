import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_EMAIL,
  createMemoryStorage,
  dispatchLocalApiRequest,
} from "./localBackend";
import type { CategoryItem, NewsArticle } from "../types";

const ADMIN_PASS = "mmnn8787";

test("Specialized departments include UI/UX & Figma and WordPress and support full CRUD", async () => {
  const storage = createMemoryStorage();
  const boot = await dispatchLocalApiRequest<{ categories: CategoryItem[] }>(
    "/api/bootstrap",
    {},
    storage
  );
  const slugs = boot.categories.map((c: CategoryItem) => c.slug);
  assert.ok(slugs.includes("ui-ux-figma"), "Missing UI/UX & Figma department");
  assert.ok(slugs.includes("wordpress"), "Missing WordPress department");

  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
      }),
    },
    storage
  );

  const figmaCat = boot.categories.find(
    (c: CategoryItem) => c.slug === "ui-ux-figma"
  );
  assert.ok(figmaCat);

  const edited = await dispatchLocalApiRequest<{ category: CategoryItem }>(
    `/api/admin/categories/${figmaCat.id}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: "طراحی رابط کاربری و فیگما پیشرفته",
        slug: "ui-ux-figma",
        description: "آپدیت‌شده از پنل مدیریت",
        icon: "Palette",
      }),
    },
    storage
  );
  assert.equal(edited.category.name, "طراحی رابط کاربری و فیگما پیشرفته");
});

test("Student registration works without email and allows login by phone or username", async () => {
  const storage = createMemoryStorage();
  const suffix = String(Date.now()).slice(-6);
  const uname = `student_ne_${suffix}`;
  const phone = `0912${suffix}1`;
  const reg = await dispatchLocalApiRequest<{ user: any }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        name: "تست دانشجو",
        username: uname,
        phone,
        password: "Password123!",
      }),
    },
    storage
  );
  assert.equal(reg.user.name, "تست دانشجو");
  assert.equal(reg.user.username, uname);

  await dispatchLocalApiRequest("/api/auth/logout", { method: "POST" }, storage);

  const loginByPhone = await dispatchLocalApiRequest<{ user: any }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: phone,
        password: "Password123!",
      }),
    },
    storage
  );
  assert.equal(loginByPhone.user.id, reg.user.id);
});

test("Instructor registration requires admin approval before course publishing", async () => {
  const storage = createMemoryStorage();
  const suffix = String(Date.now()).slice(-6);
  const instPhone = `0919${suffix}2`;
  const instReg = await dispatchLocalApiRequest<{
    user: any;
    application: any;
  }>(
    "/api/auth/register-instructor",
    {
      method: "POST",
      body: JSON.stringify({
        name: "مدرس جدید",
        phone: instPhone,
        specialty: "UI/UX & Figma",
        bio: "۵ سال سابقه طراحی محصول",
        password: "Password123!",
      }),
    },
    storage
  );

  assert.equal(instReg.application.status, "pending");
  assert.equal(instReg.user.instructorStatus, "pending");

  // Pending instructor MUST be blocked from creating courses
  await assert.rejects(
    async () => {
      await dispatchLocalApiRequest(
        "/api/admin/courses",
        {
          method: "POST",
          body: JSON.stringify({
            title: "دوره تست",
            shortDesc: "توضیح کوتاه",
            categoryId: "cat_uiux_figma",
          }),
        },
        storage
      );
    },
    (err: any) => err.status === 403
  );

  // Admin logs in and approves instructor
  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
      }),
    },
    storage
  );

  await dispatchLocalApiRequest(
    `/api/admin/instructors/${instReg.application.id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    },
    storage
  );

  // Instructor logs back in and can now create a course with attachments & pricing fields
  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: instPhone,
        password: "Password123!",
      }),
    },
    storage
  );

  const created = await dispatchLocalApiRequest<{ course: any }>(
    "/api/admin/courses",
    {
      method: "POST",
      body: JSON.stringify({
        title: "دوره جامع فیگما و دیزاین سیستم",
        shortDesc: "آموزش عملی فیگما",
        price: 2000000,
        discountPrice: 1500000,
        fullAccess: true,
        instructorSharePercent: 75,
        instructorDiscountPercent: 5,
        categoryId: "cat_uiux_figma",
        chapters: [
          {
            id: "ch_1",
            title: "فصل اول",
            position: 1,
            lessons: [
              {
                id: "ls_1",
                title: "آشنایی با فیگما",
                duration: "۱۵:۰۰",
                videoUrl: "https://example.com/v1.mp4",
                isFree: true,
                position: 1,
                attachments: [
                  {
                    id: "att_1",
                    title: "فایل تمرینی.fig",
                    fileUrl: "https://example.com/kit.fig",
                    fileSize: "4.2 MB",
                  },
                ],
              },
            ],
          },
        ],
      }),
    },
    storage
  );

  assert.equal(created.course.fullAccess, true);
  assert.equal(created.course.instructorSharePercent, 75);
  assert.equal(created.course.instructorDiscountPercent, 5);
});

test("Role-based reviews preserve authorRole and News CRUD works", async () => {
  const storage = createMemoryStorage();
  await dispatchLocalApiRequest(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASS,
      }),
    },
    storage
  );

  await dispatchLocalApiRequest(
    "/api/courses/crs_nextjs_15/reviews",
    {
      method: "POST",
      body: JSON.stringify({
        rating: 5,
        comment: "پاسخ رسمی مدیریت درباره آپدیت فصل جدید",
      }),
    },
    storage
  );

  const detail = await dispatchLocalApiRequest<{ course: any }>(
    "/api/courses/nextjs-15-fullstack-bootcamp",
    {},
    storage
  );
  const adminRev = detail.course.reviews.find((r: any) =>
    r.comment.includes("پاسخ رسمی مدیریت")
  );
  assert.ok(adminRev);
  assert.equal(adminRev.authorRole, "ADMIN");

  // News CRUD
  const createdNews = await dispatchLocalApiRequest<{ article: NewsArticle }>(
    "/api/admin/news",
    {
      method: "POST",
      body: JSON.stringify({
        title: "خبر آزمایشی تایپ‌اسکریپت",
        summary: "خلاصه کوتاه",
        content: "متن کامل خبر",
        category: "فرانت‌اند",
        isPublished: true,
      }),
    },
    storage
  );
  assert.equal(createdNews.article.title, "خبر آزمایشی تایپ‌اسکریپت");

  const publicNews = await dispatchLocalApiRequest<{ news: NewsArticle[] }>(
    "/api/news",
    {},
    storage
  );
  assert.ok(
    publicNews.news.some((n: NewsArticle) => n.id === createdNews.article.id)
  );
});
