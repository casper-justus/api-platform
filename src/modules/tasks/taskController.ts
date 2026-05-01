import { Response } from "express";
import { db } from "../../db/connection.js";
import { tasksTable } from "../../db/schema/index.js";
import { eq, desc, ilike } from "drizzle-orm";
import { AuthRequest } from "../../db/middleware/authMiddleware.js";
import { insertTaskSchema, updateTaskSchema } from "../../db/schema/tasks.js";
import { AppError } from "../../db/middleware/errorHandler.js";

export const listTasks = async (req: AuthRequest, res: Response) => {
  const { search, page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  let query = db.select().from(tasksTable);

  if (search) {
    query = query.where(ilike(tasksTable.title, `%${search}%`)) as typeof query;
  }

  const tasks = await query.orderBy(desc(tasksTable.createdAt)).limit(limitNum).offset(offset);

  const [{ count }] = await db.select({ count: db.$count(tasksTable) }).from(tasksTable);

  res.json({
    tasks,
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

export const getTask = async (req: AuthRequest, res: Response) => {
  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, getId(req)))
    .limit(1);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.json({ task });
};

export const createTask = async (req: AuthRequest, res: Response) => {
  const validated = insertTaskSchema.parse(req.body);

  const [task] = await db.insert(tasksTable).values(validated).returning();

  res.status(201).json({ task });
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const validated = updateTaskSchema.parse(req.body);

  const [task] = await db
    .update(tasksTable)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(tasksTable.id, getId(req)))
    .returning();

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.json({ task });
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, getId(req)))
    .returning();

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.status(204).send();
};
