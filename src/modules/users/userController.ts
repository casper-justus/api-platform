import { Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../../db/connection.js";
import { usersTable } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../../db/middleware/authMiddleware.js";
import { updateUserSchema } from "../../db/schema/users.js";
import { AppError } from "../../db/middleware/errorHandler.js";

export const getMe = async (req: AuthRequest, res: Response) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ user });
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  const validated = updateUserSchema.parse(req.body);

  const [user] = await db
    .update(usersTable)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      avatarUrl: usersTable.avatarUrl,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ user });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!));

  res.json({ message: "Password updated successfully" });
};
