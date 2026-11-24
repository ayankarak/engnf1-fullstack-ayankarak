import { z } from "zod";
import constants from "../utils/constants.js";

const { ROLE_VALUES } = constants;

const userIdSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const updateUserRoleSchema = z.object({
    role: z.enum(ROLE_VALUES),
});

const userListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
});

export default {
    userIdSchema,
    updateUserRoleSchema,
    userListQuerySchema,
};
