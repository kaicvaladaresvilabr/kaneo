import { type JSX, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format";
import type { CalendarTask } from "./calendar-task-bar";
import { DayOverflowTask } from "./day-overflow-task";

type DayOverflowPopoverProps = {
  day: Date;
  /** Every task on this day, not just the ones the lane cap hid. */
  tasks: CalendarTask[];
  hiddenCount: number;
  projectSlug?: string;
  onOpenTask: (taskId: string) => void;
};

export default function DayOverflowPopover({
  day,
  tasks,
  hiddenCount,
  projectSlug,
  onOpenTask,
}: DayOverflowPopoverProps): JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const dayLabel = formatDate(day, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSelectTask = (taskId: string) => {
    setOpen(false);
    onOpenTask(taskId);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label={t("tasks:calendar.dayTasksAriaLabel", { date: dayLabel })}
        className="touch-hitbox relative w-full truncate rounded-sm px-1.5 pb-1 text-left text-[10px] leading-tight text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("tasks:calendar.moreTasks", { count: hiddenCount })}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="space-y-1">
          <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {dayLabel}
          </p>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {tasks.map((task) => (
              <DayOverflowTask
                key={task.id}
                task={task}
                projectSlug={projectSlug}
                onSelect={handleSelectTask}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
