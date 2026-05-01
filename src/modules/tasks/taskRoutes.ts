import { Router } from "express";
import * as taskController from "./taskController.js";
import { authenticateToken } from "../../db/middleware/authMiddleware.js";
import { validate } from "../../db/middleware/validate.js";
import { insertTaskSchema, updateTaskSchema } from "../../db/schema/tasks.js";

const router = Router();

router.use(authenticateToken);

router.get("/", taskController.listTasks);

router.post("/", validate(insertTaskSchema), taskController.createTask);

router.get("/:id", taskController.getTask);

router.put("/:id", validate(updateTaskSchema), taskController.updateTask);

router.delete("/:id", taskController.deleteTask);

export default router;
