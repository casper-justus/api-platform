import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import authRoutes from "./modules/auth/authRoutes.js";
import userRoutes from "./modules/users/userRoutes.js";
import projectRoutes from "./modules/projects/projectRoutes.js";
import taskRoutes from "./modules/tasks/taskRoutes.js";
import { errorHandler } from "./db/middleware/errorHandler.js";
import { swaggerSpec } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import {
  helmetMiddleware,
  authLimiter,
  apiLimiter,
  hppMiddleware,
} from "./db/middleware/security.js";
import { sanitizeInput } from "./db/middleware/sanitize.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmetMiddleware);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(process.env.NODE_ENV === "test" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(hppMiddleware);
app.use(sanitizeInput);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", apiLimiter, userRoutes);
app.use("/api/projects", apiLimiter, projectRoutes);
app.use("/api/tasks", apiLimiter, taskRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Nexus API Docs",
  })
);

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    process.stdout.write(`Server running on http://localhost:${PORT}\n`);
    process.stdout.write(`API Docs at http://localhost:${PORT}/api-docs\n`);
    process.stdout.write(`Health check at http://localhost:${PORT}/health\n`);
  });
}

export default app;
