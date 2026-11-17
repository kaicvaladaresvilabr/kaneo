import { isBefore, isToday, startOfToday } from "date-fns";
import { type JSX, useLayoutEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { CalendarTask } from "./calendar-task-bar";
import { buildMonthAgenda } from "./month-agenda-model";
import { MonthAgendaTask } from "./month-agenda-task";

type MonthAgendaProps = {
  tasks: CalendarTask[];
  visibleMonth: Date;
  projectSlug?: string;
  onOpenTask: (taskId: string) => void;
};

// Phone layout for the calendar: a seven-column month grid leaves bars a few
// characters wide, so small screens get a day-by-day list instead.
export default function MonthAgenda({
  tasks,
  visibleMonth,
  projectSlug,
  onOpenTask,
}: MonthAgendaProps): JSX.Element {
  const { t } = useTranslation();
  const agenda = useMemo(
    () => buildMonthAgenda(visibleMonth, tasks),
    [visibleMonth, tasks],
  );
  // Open at today (or the next scheduled day) rather than the 1st.
  const today = startOfToday();
  const anchorIndex = agenda.findIndex(({ day }) => !isBefore(day, today));
  const listRef = useRef<HTMLOListElement>(null);
  const anchorRef = useRef<HTMLLIElement>(null);
  // Re-anchor only when the month changes, not on every task edit.
  useLayoutEffect(() => {
    const list = listRef.current;
    const anchor = anchorRef.current;
    if (!list) return;
    list.scrollTop = anchor ? anchor.offsetTop : 0;
  }, [visibleMonth]);

  if (agenda.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <p className="text-sm text-muted-foreground">
          {t("tasks:calendar.noTasksThisMonth")}
        </p>
      </div>
    );
  }

  return (
    <ol ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto">
      {agenda.map(({ day, tasks: dayTasks }, index) => {
        const isCurrentDay = isToday(day);
        return (
          <li
            key={day.toISOString()}
            ref={index === anchorIndex ? anchorRef : undefined}
            className="border-b border-border/70"
          >
            <h3
              className={cn(
                "sticky top-0 z-10 flex items-baseline gap-2 bg-background/95 px-4 pt-3 pb-1.5 text-xs font-medium text-muted-foreground backdrop-blur",
                isCurrentDay && "text-foreground",
              )}
            >
              <span className="text-sm font-semibold tabular-nums">
                {formatDate(day, { day: "numeric" })}
              </span>
              <span>
                {isCurrentDay
                  ? t("tasks:calendar.today")
                  : formatDate(day, { weekday: "long" })}
              </span>
            </h3>
            <ul className="flex flex-col gap-1.5 px-3 pb-3">
              {dayTasks.map((task) => (
                <li key={task.id}>
                  <MonthAgendaTask
                    task={task}
                    projectSlug={projectSlug}
                    onOpenTask={onOpenTask}
                  />
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
