
const CATEGORY_RULES = [
    {
        category: "BILLING",
        keywords: ["refund", "invoice", "charge", "payment"],
    },
    {
        category: "LOGIN",
        keywords: ["password", "2fa", "login", "locked out"],
    },
    {
        category: "DELIVERY",
        keywords: ["package", "shipping", "tracking", "delivery"],
    },
    {
        category: "BUG",
        keywords: ["crash", "error", "500", "exception"],
    },
];

const PRIORITY_RULES = [
    {
        priority: "URGENT",
        keywords: ["urgent", "production down", "locked out"],
    },
    {
        priority: "HIGH",
        keywords: ["error", "refund", "not arrived"],
    },
];

const containsKeyword = (text, keyword) => {
    const escapedKeyword = keyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const pattern = escapedKeyword.replace(/\s+/g, "\\s+");

    const regex = new RegExp(`\\b${pattern}\\b`, "i");

    return regex.test(text);
};

const classifyCategory = (text) => {
    for (const rule of CATEGORY_RULES) {
        const matched = rule.keywords.some((keyword) =>
            containsKeyword(text, keyword)
        );

        if (matched) {
            return rule.category;
        }
    }

    return "FEATURE_REQUEST";
};

const classifyPriority = (text) => {
    for (const rule of PRIORITY_RULES) {
        const matched = rule.keywords.some((keyword) =>
            containsKeyword(text, keyword)
        );

        if (matched) {
            return rule.priority;
        }
    }

    return "MEDIUM";
};

const classifyTicket = ({ subject = "", body = "" } = {}) => {
    const text = `${subject} ${body}`.trim().toLowerCase();

    const category = classifyCategory(text);
    const priority = classifyPriority(text);

    return {
        autoCategory: category,
        category,
        priority,
    };
};

module.exports = {
    classifyTicket,
};
