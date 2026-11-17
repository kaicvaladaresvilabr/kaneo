import type { CSSProperties, JSX } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { formatDateShort } from "@/lib/format";
import type { CalendarTaskColorInput } from "./calendar-task-color";
import CalendarSubtasks from "./calendar-subtasks";
import type { PackableTask, WeekSegment } from "./month-grid-model";
import { useCalendarTaskTone } from "./use-calendar-task-tone";

export type CalendarTask = PackableTask &
  CalendarTaskColorInput & {
    title: string;
    number: number | null;
    status: string;
    subtasks?: readonly { id: string; title: string }[];
  };

type CalendarTaskBarProps = {
  segment: WeekSegment<CalendarTask>;
  projectSlug?: string;
  onOpenTask: (taskId: string) => void;
};

export default function CalendarTaskBar({
  segment,
  projectSlug,
  onOpenTask,
}: CalendarTaskBarProps): JSX.Element {
  const { t } = useTranslation();
  const {
    task,
    lane,
    columnStart,
    columnEnd,
    continuesBefore,
    continuesAfter,
  } = segment;
  const tone = useCalendarTaskTone(task);

  const taskKey =
    projectSlug && task.number != null
      ? `${projectSlug}-${task.number}`
      : undefined;

  const range = `${formatDateShort(task.scheduleStart)} – ${formatDateShort(
    task.scheduleEnd,
  )}`;

  return (
    <button
      type="button"
      style={
        {
          gridColumn: `${columnStart} / ${columnEnd}`,
          // Row 1 holds the date numbers, so lanes start at row 2.
          gridRow: lane + 2,
          ...tone.style,
        } as CSSProperties
      }
      title={
        taskKey
          ? `${taskKey} · ${task.title} · ${range}`
          : `${task.title} · ${range}`
      }
      aria-label={t("tasks:calendar.taskAriaLabel", {
        title: task.title,
        range,
      })}
      data-task-status={task.status}
      data-calendar-task-color={tone.source}
      onClick={() => onOpenTask(task.id)}
      className={cn(
        "z-10 mb-0.5 flex h-6 min-w-0 items-center overflow-hidden border px-1.5 text-left text-[11px] font-medium leading-none text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-5",
        task.subtasks?.length &&
          "h-auto flex-col items-start gap-1 py-1 sm:h-auto",
        tone.className,
        // Bars that run past a week edge lose their cap there so the two halves
        // read as one continuous span across rows.
        continuesBefore ? "rounded-l-none border-l-0" : "ml-1 rounded-l-md",
        continuesAfter ? "rounded-r-none border-r-0" : "mr-1 rounded-r-md",
      )}
    >
      <span className="w-full truncate">{task.title}</span>
      <CalendarSubtasks subtasks={task.subtasks} />
    </button>
  );
}
