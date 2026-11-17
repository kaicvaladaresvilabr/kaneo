import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { EventChecklist } from "@/components/project/integrations/event-checklist/event-checklist";
import { FormField } from "@/components/ui/form";
import { GENERIC_WEBHOOK_EVENT_ITEMS } from "./generic-webhook-events";
import type { GenericWebhookFormValues } from "./generic-webhook-form-values";
import { ReminderLeadTimeRow } from "./reminder-lead-time-row";

type GenericWebhookEventChecklistProps<T extends FieldValues> = {
  control: Control<T>;
};

export function GenericWebhookEventChecklist<
  T extends FieldValues &
    Pick<GenericWebhookFormValues, "events" | "dueDateReminderLeadTimeHours">,
>({ control }: GenericWebhookEventChecklistProps<T>) {
  const { t } = useTranslation();

  return (
    <FormField
      control={control}
      name={"events" as FieldPath<T>}
      render={({ field }) => (
        <EventChecklist
          columns={3}
          items={GENERIC_WEBHOOK_EVENT_ITEMS}
          label={t("settings:genericWebhookIntegration.eventsTitle")}
          onChange={field.onChange}
          value={field.value}
        >
          {field.value.dueDateReminder ? (
            <ReminderLeadTimeRow control={control} />
          ) : null}
        </EventChecklist>
      )}
    />
  );
}
