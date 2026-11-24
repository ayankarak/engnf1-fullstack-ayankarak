import express from "express";
import userController from "../controllers/user.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import constants from "../utils/constants.js";
import userValidator from "../validators/user.validator.js";

const { ROLES } = constants;

const {
    userIdSchema,
    updateUserRoleSchema,
    userListQuerySchema,
} = userValidator;

const router = express.Router();

router.use(authenticate);

// GET /api/users/assignable  (agents and admins: who can a ticket be assigned to)
router.get("/assignable", authorize(ROLES.AGENT, ROLES.ADMIN), userController.assignable);

// GET /api/users  (ADMIN)
router.get(
    "/",
    authorize(ROLES.ADMIN),
    validate(userListQuerySchema, "query"),
    userController.list
);

// PATCH /api/users/:id/role  (ADMIN)
router.patch(
    "/:id/role",
    authorize(ROLES.ADMIN),
    validate(userIdSchema, "params"),
    validate(updateUserRoleSchema),
    userController.updateRole
);

export default router;
