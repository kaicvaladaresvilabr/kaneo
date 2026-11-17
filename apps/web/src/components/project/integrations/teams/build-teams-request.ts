import type { CreateTeamsIntegrationRequest } from "@/fetchers/teams-integration/create-teams-integration";
import type { UpdateTeamsIntegrationRequest } from "@/fetchers/teams-integration/update-teams-integration";
import {
  teamsWebhookUrlPattern,
  type TeamsFormValues,
} from "./teams-form-values";

export type TeamsRequest =
  | { kind: "invalid" }
  | { kind: "create"; data: CreateTeamsIntegrationRequest }
  | { kind: "update"; json: UpdateTeamsIntegrationRequest };

export function buildTeamsRequest(
  values: TeamsFormValues,
  connected: boolean,
): TeamsRequest {
  const webhookUrl = values.webhookUrl.trim();
  const channelName = values.channelName.trim();
  const validUrl = teamsWebhookUrlPattern.test(webhookUrl);

  if (!validUrl && (!connected || webhookUrl)) {
    return { kind: "invalid" };
  }

  const leadTime = values.events.dueDateReminder
    ? {
        dueDateReminderLeadTimeMinutes: Math.round(
          values.dueDateReminderLeadTimeHours * 60,
        ),
      }
    : {};

  if (!connected) {
    return {
      kind: "create",
      data: {
        webhookUrl,
        channelName: channelName || undefined,
        events: values.events,
        ...leadTime,
      },
    };
  }

  return {
    kind: "update",
    json: {
      webhookUrl: webhookUrl || undefined,
      channelName: channelName || null,
      events: values.events,
      ...leadTime,
    },
  };
}
