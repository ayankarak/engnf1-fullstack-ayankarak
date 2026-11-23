require("dotenv").config();

const bcrypt = require("bcrypt");

const sequelize = require("../config/database");
const { User } = require("../models");

const createAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
            );
        }

        await sequelize.authenticate();

        const existingAdmin = await User.findOne({
            where: { email: ADMIN_EMAIL.trim().toLowerCase() },
        });

        if (existingAdmin) {
            console.log("A user with this email already exists.");
            return;
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const admin = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            role: "ADMIN",
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
