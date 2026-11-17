import { genericWebhookEventToggles } from "../integrations/schema";
import { z } from "../openapi";

const leadTimeMinutes = z
  .number()
  .int()
  .min(5)
  .max(43_200)
  .openapi({ description: "Between 5 minutes and 30 days." });

export const createTeamsBody = z.object({
  webhookUrl: z.string().min(1),
  channelName: z.string().optional(),
  events: genericWebhookEventToggles.optional(),
  dueDateReminderLeadTimeMinutes: leadTimeMinutes.optional(),
});

export const updateTeamsBody = z.object({
  webhookUrl: z.string().optional(),
  channelName: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  events: genericWebhookEventToggles.optional(),
  dueDateReminderLeadTimeMinutes: leadTimeMinutes.optional(),
});
