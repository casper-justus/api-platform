import request from "supertest";
import app from "../src/app";
import { db } from "../src/db/connection";
import { usersTable, tasksTable, refreshTokensTable } from "../src/db/schema/index";
import { eq } from "drizzle-orm";

let accessToken: string;
let taskId: string;

beforeAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(tasksTable);
  await db.delete(usersTable);

  const registerRes = await request(app).post("/api/auth/register").send({
    email: "taskuser@example.com",
    password: "password123",
    name: "Task User",
  });

  accessToken = registerRes.body.accessToken;
});

afterAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(tasksTable);
  await db.delete(usersTable);
});

describe("POST /api/tasks", () => {
  it("creates a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Build API feature",
        description: "Implement the user authentication endpoint",
        priority: "high",
      });

    expect(res.status).toBe(201);
    expect(res.body.task).toHaveProperty("id");
    expect(res.body.task.title).toBe("Build API feature");
    expect(res.body.task.status).toBe("todo");
    expect(res.body.task.isCompleted).toBe(false);

    taskId = res.body.task.id;
  });

  it("creates a task with default priority", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Simple task" });

    expect(res.status).toBe(201);
    expect(res.body.task.priority).toBe("medium");

    await db.delete(tasksTable).where(eq(tasksTable.id, res.body.task.id));
  });

  it("rejects missing title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "No Auth" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/tasks", () => {
  it("lists all tasks", async () => {
    const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tasks");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it("supports pagination", async () => {
    const res = await request(app)
      .get("/api/tasks?page=1&limit=5")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/tasks/:id", () => {
  it("gets a task by id", async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.task.id).toBe(taskId);
  });

  it("returns 404 for non-existent task", async () => {
    const res = await request(app)
      .get("/api/tasks/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/tasks/:id", () => {
  it("updates a task", async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Updated task title", status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.task.title).toBe("Updated task title");
    expect(res.body.task.status).toBe("in_progress");
  });

  it("marks task as completed", async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isCompleted: true });

    expect(res.status).toBe(200);
    expect(res.body.task.isCompleted).toBe(true);
  });

  it("returns 404 for non-existent task", async () => {
    const res = await request(app)
      .put("/api/tasks/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Ghost task" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes a task", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.status).toBe(404);
  });

  it("returns 404 for already deleted task", async () => {
    const res = await request(app)
      .delete("/api/tasks/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
