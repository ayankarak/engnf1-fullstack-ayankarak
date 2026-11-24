import jwt from "jsonwebtoken";
import env from "../config/env.js";

// The same secret and algorithm are used to sign (login) and verify (auth middleware).
const ALGORITHM = "HS256";

const signToken = (user) =>
    jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
        algorithm: ALGORITHM,
        expiresIn: env.JWT_EXPIRES_IN,
    });

const verifyToken = (token) =>
    jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });

export default { signToken, verifyToken };
