import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../../db/connection.js";
import { usersTable, refreshTokensTable } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "./jwt.js";
import { AppError } from "../../db/middleware/errorHandler.js";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const register = async (req: Request, res: Response) => {
  const validated = registerSchema.parse(req.body);

  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, validated.email))
    .limit(1);
  if (existingUser.length > 0) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: validated.email,
      passwordHash,
      name: validated.name,
    })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });

  const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken } = generateRefreshToken(user.id);
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = getRefreshTokenExpiry();

  await db.insert(refreshTokensTable).values({
    tokenHash,
    userId: user.id,
    userAgent: req.headers["user-agent"],
    expiresAt,
  });

  res.status(201).json({
    user,
    accessToken,
    refreshToken,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: refreshToken } = generateRefreshToken(user.id);
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = getRefreshTokenExpiry();

  await db.insert(refreshTokensTable).values({
    tokenHash,
    userId: user.id,
    userAgent: req.headers["user-agent"],
    expiresAt,
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const [storedToken] = await db
    .select()
    .from(refreshTokensTable)
    .where(eq(refreshTokensTable.tokenHash, tokenHash))
    .limit(1);

  if (!storedToken || storedToken.revokedAt) {
    throw new AppError("Refresh token has been revoked", 401);
  }

  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.tokenHash, tokenHash));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub)).limit(1);
  if (!user || !user.isActive) {
    throw new AppError("User not found or deactivated", 401);
  }

  const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role });
  const { token: newRefreshToken } = generateRefreshToken(user.id);
  const newTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
  const newExpiresAt = getRefreshTokenExpiry();

  await db.insert(refreshTokensTable).values({
    tokenHash: newTokenHash,
    userId: user.id,
    userAgent: req.headers["user-agent"],
    expiresAt: newExpiresAt,
  });

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  await db
    .update(refreshTokensTable)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokensTable.tokenHash, tokenHash));

  res.json({ message: "Logged out successfully" });
};
