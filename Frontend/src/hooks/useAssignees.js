import { useEffect, useState } from "react";

import { listAssignableUsers } from "../api/tickets.js";

// Agents/admins a ticket can be assigned to. Only loaded for users allowed to assign.
export function useAssignees(enabled) {
    const [assignees, setAssignees] = useState([]);

    useEffect(() => {
        if (!enabled) return undefined;

        const controller = new AbortController();

        listAssignableUsers(controller.signal)
            .then((data) => setAssignees(data.users))
            .catch(() => {
                // The assignee dropdown simply stays empty; ticket editing still works.
            });

        return () => controller.abort();
    }, [enabled]);

    return assignees;
}
