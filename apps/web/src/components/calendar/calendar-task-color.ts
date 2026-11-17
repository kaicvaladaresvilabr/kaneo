import { resolveColumnColor } from "@/lib/column-color";
import { resolveLabelColor } from "@/lib/label-color";
import type { CalendarTaskColor } from "@/store/user-preferences";

export type CalendarTaskColorInput = {
  columnColor?: string | null;
  labels?: Array<{ color?: string | null }> | null;
};

type ColumnColorSource = {
  id: string;
  slug?: string;
  color?: string | null;
};

export function attachCalendarColumnColors<TTask extends { status: string }>(
  tasks: TTask[],
  columns: readonly ColumnColorSource[],
): Array<TTask & { columnColor: string | null }> {
  const colors = new Map<string, string | null>();
  for (const column of columns) {
    colors.set(column.id, column.color ?? null);
    if (column.slug) colors.set(column.slug, column.color ?? null);
  }

  return tasks.map((task) => ({
    ...task,
    columnColor: colors.get(task.status) ?? null,
  }));
}

export function resolveCalendarTaskColor({
  source,
  columnColor,
  labels,
}: CalendarTaskColorInput & { source: CalendarTaskColor }): string | null {
  if (source === "none") return null;

  if (source === "label") {
    const color = labels?.find((label) => label.color?.trim())?.color?.trim();
    return color ? resolveLabelColor(color) : null;
  }

  return resolveColumnColor(columnColor);
}

export const CALENDAR_TASK_TINTED_CLASS =
  "border-[color-mix(in_oklab,var(--calendar-task-color)_40%,transparent)] bg-[color-mix(in_oklab,var(--calendar-task-color)_16%,transparent)] hover:border-[color-mix(in_oklab,var(--calendar-task-color)_55%,transparent)] hover:bg-[color-mix(in_oklab,var(--calendar-task-color)_24%,transparent)]";

export const CALENDAR_TASK_UNTINTED_CLASS =
  "border-border/70 bg-muted/40 hover:border-border hover:bg-muted/55";

export function calendarTaskTone(color: string | null): {
  className: string;
  style?: { "--calendar-task-color": string };
} {
  if (!color) return { className: CALENDAR_TASK_UNTINTED_CLASS };
  return {
    className: CALENDAR_TASK_TINTED_CLASS,
    style: { "--calendar-task-color": color },
  };
}
