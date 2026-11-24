const bcrypt = require("bcrypt");

const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so that response time does not reveal
// whether an account exists.
const DUMMY_HASH = "$2b$12$2770Lf4w65X5swzsguiHEuzDjWP0hNT9dMfWTG.K..Mr5/Yk6GkOe";

class AuthService {
    async register(userData) {
        const existingUser = await userRepository.findByEmail(userData.email);

        if (existingUser) {
            throw new ApiError(409, "Email already registered");
        }

        const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

        // Public registration always creates a USER; ADMIN accounts come from the
        // create-admin script and roles are changed by an admin afterwards.
        return await userRepository.create({
            name: userData.name,
            email: userData.email,
            passwordHash,
        });
    }

    async login(email, password) {
        const user = await userRepository.findByEmail(email);

        const isPasswordValid = await bcrypt.compare(
            password,
            user ? user.passwordHash : DUMMY_HASH
        );

        if (!user || !isPasswordValid) {
            throw new ApiError(401, "Invalid email or password");
        }

        return {
            user,
            token: signToken(user),
        };
    }
}

module.exports = new AuthService();
