import userRepository from "../repositories/user.repository.js";
import ApiError from "../utils/ApiError.js";

class UserService {
    async listAssignable() {
        return await userRepository.findAssignable();
    }

    async listUsers({ page, limit }) {
        const result = await userRepository.findAll({
            limit,
            offset: (page - 1) * limit,
        });

        return {
            users: result.rows,
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        };
    }

    async updateRole(actor, userId, role) {
        // Prevents an admin from locking everyone out by demoting themselves.
        if (actor.id === userId) {
            throw new ApiError(400, "You cannot change your own role");
        }

        const user = await userRepository.update(userId, { role });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        return user;
    }
}

export default new UserService();
