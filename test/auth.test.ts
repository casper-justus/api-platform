import request from "supertest";
import app from "../src/app";
import { db } from "../src/db/connection";
import { usersTable, refreshTokensTable } from "../src/db/schema/index";
import { eq } from "drizzle-orm";

let accessToken: string;
let refreshToken: string;

beforeAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(usersTable);

  const registerRes = await request(app).post("/api/auth/register").send({
    email: "test@example.com",
    password: "password123",
    name: "Test User",
  });

  accessToken = registerRes.body.accessToken;
  refreshToken = registerRes.body.refreshToken;
});

afterAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(usersTable);
});

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "newuser@example.com",
      password: "securepassword",
      name: "New User",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("newuser@example.com");
    expect(res.body.user.name).toBe("New User");
    expect(res.body.user).not.toHaveProperty("passwordHash");

    await db.delete(refreshTokensTable);
    await db.delete(usersTable).where(eq(usersTable.email, "newuser@example.com"));
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "password123",
      name: "First",
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "duplicate@example.com",
      password: "password456",
      name: "Second",
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty("error");

    await db.delete(refreshTokensTable);
    await db.delete(usersTable).where(eq(usersTable.email, "duplicate@example.com"));
  });

  it("rejects invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "invalid-email",
      password: "password123",
      name: "Test",
    });

    expect(res.status).toBe(400);
  });

  it("rejects short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "shortpwd@example.com",
      password: "short",
      name: "Test",
    });

    expect(res.status).toBe(400);
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("rejects invalid password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });

  it("rejects missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  it("refreshes tokens successfully", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.refreshToken).not.toBe(refreshToken);

    refreshToken = res.body.refreshToken;
  });

  it("rejects invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid-token",
    });

    expect(res.status).toBe(401);
  });

  it("rejects expired/used token", async () => {
    const oldToken = refreshToken;
    await request(app).post("/api/auth/refresh").send({ refreshToken: oldToken });

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: oldToken });
    expect(res.status).toBe(401);
  });

  it("rejects missing refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/logout", () => {
  it("logs out successfully", async () => {
    const { body: loginBody } = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "password123",
    });
    const freshRefreshToken = loginBody.refreshToken;

    const res = await request(app).post("/api/auth/logout").send({
      refreshToken: freshRefreshToken,
    });

    expect(res.status).toBe(200);

    const reuseRes = await request(app).post("/api/auth/refresh").send({
      refreshToken: freshRefreshToken,
    });
    expect(reuseRes.status).toBe(401);
  });

  it("rejects missing refresh token", async () => {
    const res = await request(app).post("/api/auth/logout").send({});
    expect(res.status).toBe(400);
  });
});
