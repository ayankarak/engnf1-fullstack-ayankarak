
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRepository = require("../repositories/user.repository");

class AuthService {
    async register(userData) {
        const existingUser = await userRepository.findByEmail(
            userData.email
        );

        if (existingUser) {
            const error = new Error("Email already registered");
            error.statusCode = 409;
            throw error;
        }

        const passwordHash = await bcrypt.hash(userData.password, 12);

        const user = await userRepository.create({
            name: userData.name,
            email: userData.email,
            passwordHash,
        });

        return user;
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "24h",
            }
        );

        return {
            user,
            token,
        };
    }
}

module.exports = new AuthService();
