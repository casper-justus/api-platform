import { Router } from "express";
import * as authController from "./authController.js";
import { validate } from "../../db/middleware/validate.js";
import { z } from "zod";

const router = Router();

router.post(
  "/register",
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).max(255),
    })
  ),
  authController.register
);

router.post(
  "/login",
  validate(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  ),
  authController.login
);

router.post(
  "/refresh",
  validate(
    z.object({
      refreshToken: z.string(),
    })
  ),
  authController.refresh
);

router.post(
  "/logout",
  validate(
    z.object({
      refreshToken: z.string(),
    })
  ),
  authController.logout
);

export default router;
