import { Router } from "express";
import { generateSlug } from "../../../src/utils/formatters";
import { getRepository } from "../db";
import { requireAuth, requireRoles } from "../middlewares/auth";
import { asyncHandler } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { createPrefixedId } from "../utils/crypto";
import { categorySchema } from "../validators/schemas";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const repo = getRepository();
    const categories = await repo.listCategories(false);
    sendSuccess(res, { categories });
  })
);

categoriesRouter.post(
  "/admin/categories",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: categorySchema }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const { name, slug, icon, description } = req.body;
    const cleanSlug =
      generateSlug(slug?.trim() || name) || createPrefixedId("cat");
    const category = await repo.createCategory({
      name,
      slug: cleanSlug,
      icon: icon || "Code2",
      description: description ? String(description).trim() : null,
    });
    sendCreated(res, { category }, "دسته‌بندی جدید ایجاد شد.");
  })
);

categoriesRouter.put(
  "/admin/categories/:id",
  requireAuth,
  requireRoles("ADMIN"),
  validate({ body: categorySchema.partial() }),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    const { name, slug, icon, description } = req.body;
    const category = await repo.updateCategory(String(req.params.id), {
      ...(name ? { name } : {}),
      ...(slug ? { slug: generateSlug(slug) } : {}),
      ...(icon ? { icon } : {}),
      ...(description !== undefined
        ? { description: description ? String(description).trim() : null }
        : {}),
    });
    sendSuccess(res, { category }, "دسته‌بندی با موفقیت ویرایش شد.");
  })
);

categoriesRouter.delete(
  "/admin/categories/:id",
  requireAuth,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const repo = getRepository();
    await repo.deleteCategory(String(req.params.id));
    sendSuccess(res, { ok: true }, "دسته‌بندی حذف شد.");
  })
);
