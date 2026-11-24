import authService from "../services/auth.service.js";
import userDto from "../dto/user.dto.js";

const { toUserDTO } = userDto;

class AuthController {
    async register(req, res, next) {
        try {
            const user = await authService.register(req.validated.body);

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    user: toUserDTO(user),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.validated.body;

            const result = await authService.login(email, password);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: toUserDTO(result.user),
                    token: result.token,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // GET /api/auth/me
    async me(req, res) {
        return res.status(200).json({
            success: true,
            message: "Current user fetched successfully",
            data: {
                user: toUserDTO(req.user),
            },
        });
    }
}

export default new AuthController();
