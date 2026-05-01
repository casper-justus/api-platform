import request from "supertest";
import app from "../src/app";

describe("Health Check", () => {
  it("GET /health returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("environment");
  });

  it("GET /api-docs returns swagger docs", async () => {
    const res = await request(app).get("/api-docs/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });

  it("GET /api-docs.json returns OpenAPI spec", async () => {
    const res = await request(app).get("/api-docs.json");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("openapi", "3.0.0");
    expect(res.body).toHaveProperty("info");
    expect(res.body).toHaveProperty("paths");
    expect(res.body.info).toHaveProperty("title", "Nexus API");
  });
});

describe("404 Handling", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});
