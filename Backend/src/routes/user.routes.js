const express = require("express");

const userController = require("../controllers/user.controller");

const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { ROLES } = require("../utils/constants");

const {
    userIdSchema,
    updateUserRoleSchema,
    userListQuerySchema,
} = require("../validators/user.validator");

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

module.exports = router;
