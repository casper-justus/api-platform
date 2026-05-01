import { Response } from "express";
import { db } from "../../db/connection.js";
import { projectsTable } from "../../db/schema/index.js";
import { eq, desc, ilike } from "drizzle-orm";
import { AuthRequest } from "../../db/middleware/authMiddleware.js";
import { insertProjectSchema, updateProjectSchema } from "../../db/schema/projects.js";
import { AppError } from "../../db/middleware/errorHandler.js";

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const listProjects = async (req: AuthRequest, res: Response) => {
  const { search, status, page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(projectsTable);

  if (search) {
    query = query.where(ilike(projectsTable.name, `%${search}%`)) as typeof query;
  }

  if (status) {
    query = query.where(eq(projectsTable.status, status as string)) as typeof query;
  }

  const projects = await query
    .orderBy(desc(projectsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db.select({ count: db.$count(projectsTable) }).from(projectsTable);

  res.json({
    projects,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  });
};

const getId = (req: AuthRequest): string => {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
};

export const getProject = async (req: AuthRequest, res: Response) => {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, getId(req)))
    .limit(1);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res.json({ project });
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const validated = insertProjectSchema.parse(req.body);
  const slug = slugify(validated.name);

  const [existing] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.slug, slug))
    .limit(1);

  if (existing) {
    throw new AppError("A project with this name already exists", 409);
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ ...validated, slug })
    .returning();

  res.status(201).json({ project });
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const validated = updateProjectSchema.parse(req.body);

  const [project] = await db
    .update(projectsTable)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(projectsTable.id, getId(req)))
    .returning();

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res.json({ project });
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, getId(req)))
    .returning();

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  res.status(204).send();
};
