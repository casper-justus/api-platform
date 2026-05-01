import request from "supertest";
import app from "../src/app";
import { db } from "../src/db/connection";
import { usersTable, refreshTokensTable } from "../src/db/schema/index";

let accessToken: string;
let refreshToken: string;
let userId: string;

beforeAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(usersTable);

  const registerRes = await request(app).post("/api/auth/register").send({
    email: "user@example.com",
    password: "password123",
    name: "Original Name",
  });

  userId = registerRes.body.user.id;
  accessToken = registerRes.body.accessToken;
  refreshToken = registerRes.body.refreshToken;
});

afterAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(usersTable);
});

describe("GET /api/users/me", () => {
  it("returns current user profile", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("user@example.com");
    expect(res.body.user.name).toBe("Original Name");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/users/me", () => {
  it("updates user profile", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Updated Name");
  });

  it("updates user email", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email: "newemail@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("newemail@example.com");
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).put("/api/users/me").send({ name: "Hack Attempt" });
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/users/me/password", () => {
  it("changes password successfully", async () => {
    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "password123", newPassword: "newpassword456" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Password updated");

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "newemail@example.com",
      password: "newpassword456",
    });
    expect(loginRes.status).toBe(200);

    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
  });

  it("rejects wrong current password", async () => {
    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpassword789" });

    expect(res.status).toBe(400);
  });

  it("rejects short new password", async () => {
    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currentPassword: "newpassword456", newPassword: "short" });

    expect(res.status).toBe(400);
  });
});
