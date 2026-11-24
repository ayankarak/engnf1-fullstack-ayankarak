import express from "express";
import authController from "../controllers/auth.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import authValidator from "../validators/auth.validator.js";

const { registerSchema, loginSchema } = authValidator;

const router = express.Router();

// POST /api/auth/register
router.post("/register", validate(registerSchema), authController.register);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

// GET /api/auth/me
router.get("/me", authenticate, authController.me);

export default router;
