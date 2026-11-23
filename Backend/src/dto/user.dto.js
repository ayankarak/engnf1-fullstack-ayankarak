
const toUserDTO = (user) => {
    if (!user) return null;

    const data = user.toJSON ? user.toJSON() : user;

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
    };
};

module.exports = {
    toUserDTO,
};
