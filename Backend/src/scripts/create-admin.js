require("dotenv").config();

const bcrypt = require("bcrypt");

const sequelize = require("../config/database");
const { User } = require("../models");
const { ROLES } = require("../utils/constants");

// Creates the initial ADMIN account from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// Run it once after the migrations: npm run db:create-admin
const createAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
        }

        if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
            throw new Error("ADMIN_PASSWORD must be between 8 and 72 characters");
        }

        await sequelize.authenticate();

        const existing = await User.findOne({
            where: { email: ADMIN_EMAIL.trim().toLowerCase() },
        });

        if (existing) {
            console.log(
                `A user with this email already exists (role: ${existing.role}). ` +
                    "Nothing was changed; an admin can change roles via PATCH /api/users/:id/role."
            );
            return;
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const admin = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            role: ROLES.ADMIN,
        });

        console.log(`Admin created successfully. ID: ${admin.id}`);
    } catch (error) {
        console.error("Failed to create admin:", error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

createAdmin();
