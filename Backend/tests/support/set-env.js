// Gives unit tests a valid environment without touching your real .env values.
const defaults = {
    NODE_ENV: "test",
    DB_HOST: "127.0.0.1",
    DB_PORT: "3306",
    DB_USER: "unit_test_user",
    DB_PASSWORD: "unit_test_password",
    DB_NAME: "triagesync_test",
    JWT_SECRET: "unit-test-secret-unit-test-secret-1234567890",
};

for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) process.env[key] = value;
}
