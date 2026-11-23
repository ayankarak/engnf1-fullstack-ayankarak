
const { User } = require("../models");

class UserRepository {
    async create(userData) {
        return await User.create(userData);
    }

    async findById(id) {
        return await User.findByPk(id);
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
            order: [["createdAt", "DESC"]],
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
