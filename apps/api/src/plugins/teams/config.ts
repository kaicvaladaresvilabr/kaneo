import * as v from "valibot";
import { assertPublicWebhookDestination } from "../generic-webhook/config";

export const teamsEventKeys = [
  "taskCreated",
  "taskStatusChanged",
  "taskPriorityChanged",
  "taskTitleChanged",
  "taskDescriptionChanged",
  "taskCommentCreated",
  "taskDeleted",
  "taskMoved",
  "taskDueDateChanged",
  "taskAssigneeChanged",
  "taskUnassigned",
  "dueDateReminder",
] as const;

export type TeamsEventKey = (typeof teamsEventKeys)[number];

const teamsWebhookHost =
  /^(?:[a-z0-9-]+\.)*(?:logic\.azure\.com|webhook\.office\.com|powerplatform\.com)$/i;

export function isTeamsWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && teamsWebhookHost.test(url.hostname);
  } catch {
    return false;
  }
}

export function isOfficeConnectorUrl(value: string): boolean {
  try {
    return new URL(value).hostname.toLowerCase().endsWith("webhook.office.com");
  } catch {
    return false;
  }
}

// Workflow URLs keep the shared secret in the query string, so the preview
// drops the query as well as the last path segment.
export function maskTeamsWebhookUrl(value: string): string {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    const maskedLast =
      last.length > 8 ? `${last.slice(0, 4)}…${last.slice(-4)}` : "••••";
    const path = `${url.origin}/${parts.slice(0, -1).join("/")}/${maskedLast}`;
    return url.search ? `${path}?…` : path;
  } catch {
    return "Configured";
  }
}

const teamsEventsSchema = v.object({
  taskCreated: v.optional(v.boolean()),
  taskStatusChanged: v.optional(v.boolean()),
  taskPriorityChanged: v.optional(v.boolean()),
  taskTitleChanged: v.optional(v.boolean()),
  taskDescriptionChanged: v.optional(v.boolean()),
  taskCommentCreated: v.optional(v.boolean()),
  taskDeleted: v.optional(v.boolean()),
  taskMoved: v.optional(v.boolean()),
  taskDueDateChanged: v.optional(v.boolean()),
  taskAssigneeChanged: v.optional(v.boolean()),
  taskUnassigned: v.optional(v.boolean()),
  dueDateReminder: v.optional(v.boolean()),
});

export const teamsConfigSchema = v.object({
  webhookUrl: v.pipe(
    v.string(),
    v.url(),
    v.check(isTeamsWebhookUrl, "Enter a Teams workflow webhook URL"),
  ),
  channelName: v.optional(v.string()),
  events: v.optional(teamsEventsSchema),
  dueDateReminderLeadTimeMinutes: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(5), v.maxValue(43_200)),
  ),
});

export type TeamsConfig = v.InferOutput<typeof teamsConfigSchema>;

export const defaultTeamsEvents: Record<TeamsEventKey, boolean> = {
  taskCreated: true,
  taskStatusChanged: true,
  taskPriorityChanged: false,
  taskTitleChanged: false,
  taskDescriptionChanged: false,
  taskCommentCreated: true,
  taskDeleted: false,
  taskMoved: false,
  taskDueDateChanged: false,
  taskAssigneeChanged: false,
  taskUnassigned: false,
  dueDateReminder: false,
};

export function normalizeTeamsConfig(config: TeamsConfig): TeamsConfig {
  return {
    ...config,
    channelName: config.channelName?.trim() || undefined,
    dueDateReminderLeadTimeMinutes:
      config.dueDateReminderLeadTimeMinutes ?? 1440,
    events: {
      ...defaultTeamsEvents,
      ...config.events,
    },
  };
}

export async function validateTeamsConfig(
  config: unknown,
): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    const parsed = v.parse(teamsConfigSchema, config);
    await assertPublicWebhookDestination(parsed.webhookUrl);
    return { valid: true };
  } catch (error) {
    if (error instanceof v.ValiError) {
      return {
        valid: false,
        errors: error.issues.map((issue) => issue.message),
      };
    }

    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Invalid config"],
    };
  }
}
