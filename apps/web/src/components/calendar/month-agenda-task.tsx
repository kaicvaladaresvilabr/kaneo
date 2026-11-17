import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { formatDateShort } from "@/lib/format";
import type { CalendarTask } from "./calendar-task-bar";
import CalendarSubtasks from "./calendar-subtasks";
import { useCalendarTaskTone } from "./use-calendar-task-tone";

type MonthAgendaTaskProps = {
  task: CalendarTask;
  projectSlug?: string;
  onOpenTask: (taskId: string) => void;
};

export function MonthAgendaTask({
  task,
  projectSlug,
  onOpenTask,
}: MonthAgendaTaskProps): JSX.Element {
  const { t } = useTranslation();
  const tone = useCalendarTaskTone(task);
  const taskKey =
    projectSlug && task.number != null
      ? `${projectSlug}-${task.number}`
      : undefined;
  const range = `${formatDateShort(task.scheduleStart)} – ${formatDateShort(task.scheduleEnd)}`;

  return (
    <button
      type="button"
      onClick={() => onOpenTask(task.id)}
      aria-label={t("tasks:calendar.taskAriaLabel", {
        title: task.title,
        range,
      })}
      data-task-status={task.status}
      data-calendar-task-color={tone.source}
      style={tone.style as CSSProperties}
      className={cn(
        "flex min-h-11 w-full flex-col justify-center gap-0.5 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone.className,
      )}
    >
      <span className="text-sm font-medium text-foreground">{task.title}</span>
      <span className="text-xs text-muted-foreground">
        {taskKey ? `${taskKey} · ${range}` : range}
      </span>
      <CalendarSubtasks subtasks={task.subtasks} />
    </button>
  );
}
