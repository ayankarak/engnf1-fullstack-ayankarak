
const authService = require("../services/auth.service");
const { toUserDTO } = require("../dto/user.dto");

class AuthController {
    async register(req, res, next) {
        try {
            const user = await authService.register(
                req.validated.body
            );

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
}

module.exports = new AuthController();
