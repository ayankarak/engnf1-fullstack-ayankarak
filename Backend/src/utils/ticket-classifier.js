// Simple, explicit inflections only; "ing" forms are listed per keyword so that
// unrelated words (e.g. "packaging" vs "package") do not match by accident.
const inflect = (word, extra = []) => {
    const forms = new Set([word, `${word}s`, `${word}es`, `${word}ed`, ...extra]);

    if (word.endsWith("e")) forms.add(`${word}d`);
    if (word.endsWith("y")) forms.add(`${word.slice(0, -1)}ies`);

    return [...forms];
};

const kw = (phrase, extraForms = []) => {
    const isSingleWord = /^[a-z]{4,}$/.test(phrase);
    const forms = isSingleWord ? inflect(phrase, extraForms) : [phrase];

    const source = forms
        .map((form) =>
            form
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/\s+/g, "\\s+")
        )
        .join("|");

    // Letters/digits on either side mean "part of a longer word", so no match.
    return new RegExp(`(?<![a-z0-9])(?:${source})(?![a-z0-9])`);
};

const CATEGORY_RULES = [
    {
        category: "BILLING",
        matchers: [kw("refund", ["refunding"]), kw("invoice", ["invoicing"]), kw("charge", ["charging"]), kw("payment")],
    },
    {
        category: "LOGIN",
        matchers: [kw("password"), kw("2fa"), kw("login"), kw("locked out")],
    },
    {
        category: "DELIVERY",
        matchers: [kw("package"), kw("shipping"), kw("tracking"), kw("delivery")],
    },
    {
        category: "BUG",
        matchers: [kw("crash", ["crashing"]), kw("error"), kw("500"), kw("exception")],
    },
];

const PRIORITY_RULES = [
    {
        priority: "URGENT",
        matchers: [kw("urgent"), kw("production down"), kw("locked out")],
    },
    {
        priority: "HIGH",
        matchers: [kw("error"), kw("refund", ["refunding"]), kw("not arrived")],
    },
];

const firstMatch = (rules, key, text, fallback) => {
    for (const rule of rules) {
        if (rule.matchers.some((matcher) => matcher.test(text))) {
            return rule[key];
        }
    }

    return fallback;
};

const classifyTicket = ({ subject = "", body = "" } = {}) => {
    const text = `${subject}\n${body}`.normalize("NFKC").toLowerCase();

    const category = firstMatch(CATEGORY_RULES, "category", text, "FEATURE_REQUEST");
    const priority = firstMatch(PRIORITY_RULES, "priority", text, "MEDIUM");

    return {
        autoCategory: category,
        category,
        priority,
    };
};

export default { classifyTicket };
