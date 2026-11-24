import userRepository from "../repositories/user.repository.js";
import ApiError from "../utils/ApiError.js";
import jwt from "../utils/jwt.js";

const { verifyToken } = jwt;

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError(401, "Authentication token is required");
        }

        const token = authHeader.slice("Bearer ".length).trim();

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            throw new ApiError(
                401,
                error.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
            );
        }

        // Load the user so the role is always current and deleted users are rejected.
        const user = await userRepository.findById(decoded.id);

        if (!user) {
            throw new ApiError(401, "User no longer exists");
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        next(error);
    }
};

export default authenticate;
