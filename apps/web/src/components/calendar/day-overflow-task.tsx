import type { JSX } from "react";
import { formatDateShort } from "@/lib/format";
import type { CalendarTask } from "./calendar-task-bar";
import { useCalendarTaskTone } from "./use-calendar-task-tone";

type DayOverflowTaskProps = {
  task: CalendarTask;
  projectSlug?: string;
  onSelect: (taskId: string) => void;
};

export function DayOverflowTask({
  task,
  projectSlug,
  onSelect,
}: DayOverflowTaskProps): JSX.Element {
  const tone = useCalendarTaskTone(task);

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      data-calendar-task-color={tone.source}
      className="flex w-full min-w-0 flex-col items-start gap-0.5 rounded-md border-l-[3px] px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ borderLeftColor: tone.color ?? "transparent" }}
    >
      {projectSlug && task.number != null ? (
        <span className="truncate text-[10px] text-muted-foreground">
          {projectSlug}-{task.number}
        </span>
      ) : null}
      <span className="w-full truncate text-xs font-medium text-foreground">
        {task.title}
      </span>
      <span className="w-full truncate text-[11px] text-muted-foreground">
        {formatDateShort(task.scheduleStart)} –{" "}
        {formatDateShort(task.scheduleEnd)}
      </span>
    </button>
  );
}
