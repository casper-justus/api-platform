import { Router } from "express";
import * as userController from "./userController.js";
import { authenticateToken } from "../../db/middleware/authMiddleware.js";
import { validate } from "../../db/middleware/validate.js";
import { updateUserSchema } from "../../db/schema/users.js";
import { z } from "zod";

const router = Router();

router.use(authenticateToken);

router.get("/me", userController.getMe);

router.put("/me", validate(updateUserSchema), userController.updateMe);

router.put(
  "/me/password",
  validate(
    z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    })
  ),
  userController.changePassword
);

export default router;
