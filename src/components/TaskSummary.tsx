import { useMemo } from "react";
import type { Task } from "../types/task";

export interface TaskCounts {
    pending: number;
    completed: number;
}

/** Counts pending and completed tasks in one pass. */
export function countTasks(tasks: readonly Task[]): TaskCounts {
    let completed = 0;
    for (const task of tasks) if (task.completed) completed += 1;
    return { pending: tasks.length - completed, completed };
}

/** "N pendientes - N completadas", with singular agreement ("1 pendiente", "1 completada"). */
export function formatTaskCounts({ pending, completed }: TaskCounts): string {
    const pendingLabel = pending === 1 ? "pendiente" : "pendientes";
    const completedLabel = completed === 1 ? "completada" : "completadas";
    return `${pending} ${pendingLabel} - ${completed} ${completedLabel}`;
}

interface Props {
    tasks: readonly Task[];
}

/** Heading above the list: "N pendientes - N completadas". */
export default function TaskSummary({ tasks }: Props) {
    const text = useMemo(() => formatTaskCounts(countTasks(tasks)), [tasks]);

    return (
        <h4 className="h6 text-muted mb-3" aria-live="polite">
            {text}
        </h4>
    );
}
