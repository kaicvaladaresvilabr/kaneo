import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CALENDAR_TASK_COLORS,
  isCalendarTaskColor,
  useUserPreferencesStore,
  type CalendarTaskColor,
} from "@/store/user-preferences";

export function CalendarTaskColorControl() {
  const { t } = useTranslation();
  const calendarTaskColor = useUserPreferencesStore(
    (state) => state.calendarTaskColor,
  );
  const setCalendarTaskColor = useUserPreferencesStore(
    (state) => state.setCalendarTaskColor,
  );
  const label = t("tasks:calendar.taskColor");
  const options: Record<CalendarTaskColor, string> = {
    column: t("tasks:calendar.taskColorColumn"),
    label: t("tasks:calendar.taskColorLabel"),
    none: t("tasks:calendar.taskColorNone"),
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Select
        value={calendarTaskColor}
        onValueChange={(value) => {
          if (isCalendarTaskColor(value)) setCalendarTaskColor(value);
        }}
      >
        <SelectTrigger size="sm" className="w-44" aria-label={label}>
          <SelectValue>{options[calendarTaskColor]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CALENDAR_TASK_COLORS.map((source) => (
            <SelectItem key={source} value={source}>
              {options[source]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
