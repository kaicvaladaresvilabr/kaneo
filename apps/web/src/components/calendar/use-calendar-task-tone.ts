import { useUserPreferencesStore } from "@/store/user-preferences";
import {
  calendarTaskTone,
  type CalendarTaskColorInput,
  resolveCalendarTaskColor,
} from "./calendar-task-color";

export function useCalendarTaskTone(task: CalendarTaskColorInput) {
  const source = useUserPreferencesStore((state) => state.calendarTaskColor);
  const color = resolveCalendarTaskColor({
    source,
    columnColor: task.columnColor,
    labels: task.labels,
  });

  return { source, color, ...calendarTaskTone(color) };
}
