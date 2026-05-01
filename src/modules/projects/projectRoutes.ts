import { Router } from "express";
import * as projectController from "./projectController.js";
import { authenticateToken } from "../../db/middleware/authMiddleware.js";
import { validate } from "../../db/middleware/validate.js";
import { insertProjectSchema, updateProjectSchema } from "../../db/schema/projects.js";

const router = Router();

router.use(authenticateToken);

router.get("/", projectController.listProjects);

router.post("/", validate(insertProjectSchema), projectController.createProject);

router.get("/:id", projectController.getProject);

router.put("/:id", validate(updateProjectSchema), projectController.updateProject);

router.delete("/:id", projectController.deleteProject);

export default router;
