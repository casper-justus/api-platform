import request from "supertest";
import app from "../src/app";
import { db } from "../src/db/connection";
import { usersTable, projectsTable, refreshTokensTable } from "../src/db/schema/index";

let accessToken: string;
let projectId: string;

beforeAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(projectsTable);
  await db.delete(usersTable);

  const registerRes = await request(app).post("/api/auth/register").send({
    email: "projectowner@example.com",
    password: "password123",
    name: "Project Owner",
  });

  accessToken = registerRes.body.accessToken;
});

afterAll(async () => {
  await db.delete(refreshTokensTable);
  await db.delete(projectsTable);
  await db.delete(usersTable);
});

describe("POST /api/projects", () => {
  it("creates a new project", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "My Awesome Project",
        description: "A test project",
      });

    expect(res.status).toBe(201);
    expect(res.body.project).toHaveProperty("id");
    expect(res.body.project.name).toBe("My Awesome Project");
    expect(res.body.project.slug).toBe("my-awesome-project");
    expect(res.body.project.status).toBe("active");

    projectId = res.body.project.id;
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/projects").send({ name: "No Auth Project" });
    expect(res.status).toBe(401);
  });

  it("rejects missing name", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("GET /api/projects", () => {
  it("lists all projects", async () => {
    const res = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("projects");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  it("supports pagination", async () => {
    const res = await request(app)
      .get("/api/projects?page=1&limit=5")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/projects/:id", () => {
  it("gets a project by id", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe(projectId);
  });

  it("returns 404 for non-existent project", async () => {
    const res = await request(app)
      .get("/api/projects/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/projects/:id", () => {
  it("updates a project", async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Updated Project Name" });

    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe("Updated Project Name");
  });

  it("returns 404 for non-existent project", async () => {
    const res = await request(app)
      .put("/api/projects/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Ghost Project" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/projects/:id", () => {
  it("deletes a project", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getRes.status).toBe(404);
  });

  it("returns 404 for already deleted project", async () => {
    const res = await request(app)
      .delete("/api/projects/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
