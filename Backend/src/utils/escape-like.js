// Escapes LIKE wildcards so user input is matched literally ("100%" must not match "1000").
const escapeLike = (value) => String(value).replace(/[\\%_]/g, "\\$&");

export default { escapeLike };
