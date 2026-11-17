import { genericWebhookEventsSchema } from "../integrations/response";
import { responseTimestamp, z } from "../openapi";

// The webhook URL is a bearer credential, so only a masked form is returned.
export const teamsIntegrationSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    channelName: z.string().nullable(),
    webhookConfigured: z.boolean(),
    maskedWebhookUrl: z.string().openapi({
      description:
        "The webhook URL with its secret path segment masked, or an empty string when none is set.",
    }),
    events: genericWebhookEventsSchema,
    dueDateReminderLeadTimeMinutes: z.number().openapi({
      description:
        "How long before a due date the dueDateReminder event fires, in minutes.",
    }),
    isActive: z.boolean().nullable(),
    createdAt: responseTimestamp,
    updatedAt: responseTimestamp,
  })
  .openapi("TeamsIntegration");
