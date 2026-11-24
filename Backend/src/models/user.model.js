import sequelizeModule from "sequelize";
import constants from "../utils/constants.js";

const { DataTypes } = sequelizeModule;

const { ROLE_VALUES } = constants;

const defineUser = (sequelize) => {
    const User = sequelize.define(
        "User",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            name: {
                type: DataTypes.STRING(50),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 50],
                },
            },

            email: {
                type: DataTypes.STRING(254),
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                    notEmpty: true,
                },
                set(value) {
                    this.setDataValue(
                        "email",
                        value.trim().toLowerCase()
                    );
                },
            },

            passwordHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: "password_hash",
            },

            role: {
                type: DataTypes.ENUM(...ROLE_VALUES),
                allowNull: false,
                defaultValue: "USER",
            },
        },
        {
            tableName: "users",
            timestamps: true,
        }
    );

    return User;
};

export default defineUser;
