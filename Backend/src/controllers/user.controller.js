import userService from "../services/user.service.js";
import userDto from "../dto/user.dto.js";

const { toUserDTO } = userDto;

class UserController {
    // GET /api/users/assignable
    async assignable(req, res, next) {
        try {
            const users = await userService.listAssignable();

            return res.status(200).json({
                success: true,
                message: "Assignable users fetched successfully",
                data: { users: users.map(toUserDTO) },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/users
    async list(req, res, next) {
        try {
            const result = await userService.listUsers(req.validated.query);

            return res.status(200).json({
                success: true,
                message: "Users fetched successfully",
                data: {
                    users: result.users.map(toUserDTO),
                    pagination: {
                        total: result.total,
                        page: result.page,
                        limit: result.limit,
                        totalPages: result.totalPages,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // PATCH /api/users/:id/role
    async updateRole(req, res, next) {
        try {
            const user = await userService.updateRole(
                req.user,
                req.validated.params.id,
                req.validated.body.role
            );

            return res.status(200).json({
                success: true,
                message: "User role updated successfully",
                data: { user: toUserDTO(user) },
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();
