const { Op } = require("sequelize");

const { User } = require("../models");
const { ROLES } = require("../utils/constants");

class UserRepository {
    async create(userData) {
        return await User.create(userData);
    }

    async findById(id, options = {}) {
        return await User.findByPk(id, { transaction: options.transaction });
    }

    async findByEmail(email) {
        return await User.findOne({
            where: { email },
        });
    }

    async findAll(options = {}) {
        return await User.findAndCountAll({
            attributes: { exclude: ["passwordHash"] },
            limit: options.limit,
            offset: options.offset,
            order: [["createdAt", "DESC"], ["id", "DESC"]],
        });
    }

    // Users that tickets can be assigned to.
    async findAssignable() {
        return await User.findAll({
            attributes: ["id", "name", "email", "role"],
            where: { role: { [Op.in]: [ROLES.AGENT, ROLES.ADMIN] } },
            order: [["name", "ASC"], ["id", "ASC"]],
        });
    }

    async update(id, updateData) {
        const [updatedRows] = await User.update(updateData, {
            where: { id },
        });

        if (updatedRows === 0) return null;

        return await User.findByPk(id);
    }

    async delete(id) {
        return await User.destroy({
            where: { id },
        });
    }
}

module.exports = new UserRepository();
