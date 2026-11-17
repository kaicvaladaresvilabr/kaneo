import { and, between, eq, isNotNull, isNull, ne, or } from "drizzle-orm";
import db from "../database";
import {
  columnTable,
  integrationTable,
  taskReminderSentTable,
  taskTable,
} from "../database/schema";
import {
  type GenericWebhookConfig,
  normalizeGenericWebhookConfig,
} from "../plugins/generic-webhook/config";
import { sendDueDateReminder } from "../plugins/generic-webhook/events";
import {
  type TeamsConfig,
  normalizeTeamsConfig,
} from "../plugins/teams/config";
import { sendTeamsDueDateReminder } from "../plugins/teams/events";
import {
  DUE_DATE_DURATION_MS,
  REMINDER_WINDOW_MINUTES,
} from "./reminder-timing";
import { activeIntegrationCondition } from "../plugins/active-integration-condition";

const MINUTE_MS = 60 * 1000;

type ReminderDelivery = {
  type: string;
  claimPrefix: string;
  prepare: (raw: string) => {
    leadTimeMinutes: number;
    send: (
      projectId: string,
      taskId: string,
      dueDate: Date,
    ) => Promise<boolean>;
  } | null;
};

const reminderSources: ReminderDelivery[] = [
  {
    type: "generic-webhook",
    claimPrefix: "generic_webhook",
    prepare: (raw) => {
      const config = normalizeGenericWebhookConfig(
        JSON.parse(raw) as GenericWebhookConfig,
      );
      if (!config.events?.dueDateReminder) return null;
      const leadTimeMinutes = config.dueDateReminderLeadTimeMinutes ?? 1440;
      return {
        leadTimeMinutes,
        send: (projectId, taskId, dueDate) =>
          sendDueDateReminder(
            config,
            taskId,
            projectId,
            leadTimeMinutes,
            dueDate,
          ),
      };
    },
  },
  {
    type: "teams",
    claimPrefix: "teams",
    prepare: (raw) => {
      const config = normalizeTeamsConfig(JSON.parse(raw) as TeamsConfig);
      if (!config.events?.dueDateReminder) return null;
      const leadTimeMinutes = config.dueDateReminderLeadTimeMinutes ?? 1440;
      return {
        leadTimeMinutes,
        send: (projectId, taskId, dueDate) =>
          sendTeamsDueDateReminder(
            config,
            taskId,
            projectId,
            leadTimeMinutes,
            dueDate,
          ),
      };
    },
  },
];

async function deliverReminders(source: ReminderDelivery): Promise<boolean> {
  const now = new Date();
  const integrations = await db
    .select({
      id: integrationTable.id,
      projectId: integrationTable.projectId,
      config: integrationTable.config,
    })
    .from(integrationTable)
    .where(
      and(eq(integrationTable.type, source.type), activeIntegrationCondition()),
    );
  let degraded = false;

  for (const integration of integrations) {
    try {
      const prepared = source.prepare(integration.config);
      if (!prepared) continue;

      const { leadTimeMinutes } = prepared;
      // Count back from expiration while keeping the indexed due date unmodified.
      const windowEnd = new Date(
        now.getTime() + leadTimeMinutes * MINUTE_MS - DUE_DATE_DURATION_MS,
      );
      const windowStart = new Date(
        windowEnd.getTime() - REMINDER_WINDOW_MINUTES * MINUTE_MS,
      );
      const reminderType = `${source.claimPrefix}:${integration.id}`;
      const tasks = await db
        .select({ id: taskTable.id, dueDate: taskTable.dueDate })
        .from(taskTable)
        .leftJoin(columnTable, eq(taskTable.columnId, columnTable.id))
        .leftJoin(
          taskReminderSentTable,
          and(
            eq(taskReminderSentTable.taskId, taskTable.id),
            eq(taskReminderSentTable.reminderType, reminderType),
          ),
        )
        .where(
          and(
            eq(taskTable.projectId, integration.projectId),
            isNotNull(taskTable.dueDate),
            between(taskTable.dueDate, windowStart, windowEnd),
            isNull(taskReminderSentTable.id),
            or(isNull(columnTable.isFinal), eq(columnTable.isFinal, false)),
            ne(taskTable.status, "archived"),
          ),
        );

      for (const task of tasks) {
        if (!task.dueDate) continue;

        const [sentRecord] = await db
          .insert(taskReminderSentTable)
          .values({ taskId: task.id, reminderType })
          .onConflictDoNothing({
            target: [
              taskReminderSentTable.taskId,
              taskReminderSentTable.reminderType,
            ],
          })
          .returning({ id: taskReminderSentTable.id });
        if (!sentRecord) continue;

        const delivered = await prepared.send(
          integration.projectId,
          task.id,
          task.dueDate,
        );

        if (!delivered) {
          await db
            .delete(taskReminderSentTable)
            .where(eq(taskReminderSentTable.id, sentRecord.id));
        }
      }
    } catch (error) {
      degraded = true;
      console.error("Failed to process project webhook reminder", {
        integrationId: integration.id,
        projectId: integration.projectId,
        error,
      });
    }
  }

  return degraded;
}

export async function checkProjectWebhookReminders(): Promise<{
  degraded: boolean;
}> {
  let degraded = false;
  for (const source of reminderSources) {
    if (await deliverReminders(source)) degraded = true;
  }
  return { degraded };
}
