import { z } from "zod/v4";
import type { TeamsIntegration } from "@/fetchers/teams-integration/get-teams-integration";
import {
  type GenericWebhookEvents,
  toGenericWebhookEvents,
} from "@/components/project/integrations/generic-webhook/generic-webhook-events";
import {
  MAX_LEAD_TIME_HOURS,
  MIN_LEAD_TIME_HOURS,
} from "@/components/project/integrations/generic-webhook/generic-webhook-form-values";

export const teamsWebhookUrlPattern =
  /^https:\/\/(?:[a-z0-9-]+\.)*(?:logic\.azure\.com|webhook\.office\.com|powerplatform\.com)(?::\d+)?\/\S+$/i;

export type TeamsFormValues = {
  webhookUrl: string;
  channelName: string;
  events: GenericWebhookEvents;
  dueDateReminderLeadTimeHours: number;
};

export function createTeamsFormSchema(leadTimeMessage: string) {
  return z
    .object({
      webhookUrl: z.string(),
      channelName: z.string(),
      events: z.object({
        taskCreated: z.boolean(),
        taskStatusChanged: z.boolean(),
        taskPriorityChanged: z.boolean(),
        taskTitleChanged: z.boolean(),
        taskDescriptionChanged: z.boolean(),
        taskCommentCreated: z.boolean(),
        taskDeleted: z.boolean(),
        taskMoved: z.boolean(),
        taskDueDateChanged: z.boolean(),
        taskAssigneeChanged: z.boolean(),
        taskUnassigned: z.boolean(),
        dueDateReminder: z.boolean(),
      }),
      dueDateReminderLeadTimeHours: z.number(),
    })
    .refine(
      (values) =>
        !values.events.dueDateReminder ||
        (values.dueDateReminderLeadTimeHours >= MIN_LEAD_TIME_HOURS &&
          values.dueDateReminderLeadTimeHours <= MAX_LEAD_TIME_HOURS),
      { path: ["dueDateReminderLeadTimeHours"], message: leadTimeMessage },
    );
}

export function toTeamsFormValues(
  integration: TeamsIntegration | null | undefined,
): TeamsFormValues {
  return {
    webhookUrl: "",
    channelName: integration?.channelName ?? "",
    events: toGenericWebhookEvents(integration?.events),
    dueDateReminderLeadTimeHours:
      (integration?.dueDateReminderLeadTimeMinutes ?? 1440) / 60,
  };
}
