import { and, eq } from "drizzle-orm";
import db from "../../database";
import {
  columnTable,
  projectTable,
  taskTable,
  userTable,
  workspaceTable,
} from "../../database/schema";
import { safeOutboundError } from "../../utils/outbound-request";
import type {
  PluginContext,
  TaskAssigneeChangedEvent,
  TaskCommentCreatedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
  TaskDescriptionChangedEvent,
  TaskDueDateChangedEvent,
  TaskMovedEvent,
  TaskPriorityChangedEvent,
  TaskStatusChangedEvent,
  TaskTitleChangedEvent,
  TaskUnassignedEvent,
} from "../types";
import { teamsCardCopy } from "./card-copy";
import { type TeamsCard, postToTeams } from "./client";
import type { TeamsConfig, TeamsEventKey } from "./config";
import { normalizeTeamsConfig } from "./config";

type TeamsEventData = {
  taskTitle: string;
  taskNumber: number | null;
  projectName: string;
  taskUrl: string | null;
  actorName: string | null;
  status: string | null;
  columnName: string | null;
  priority: string | null;
  locale: string | null;
};

function isEnabled(config: TeamsConfig, key: TeamsEventKey): boolean {
  return config.events?.[key] ?? false;
}

function truncate(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1)}…`;
}

function formatDue(value: Date | string | null, none: string): string {
  if (!value) return none;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return none;
  return date.toISOString().slice(0, 10);
}

async function getActor(userId: string | null): Promise<{
  name: string | null;
  locale: string | null;
}> {
  if (!userId) return { name: null, locale: null };
  const [user] = await db
    .select({ name: userTable.name, locale: userTable.locale })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return { name: user?.name ?? null, locale: user?.locale ?? null };
}

async function getTeamsEventData(
  taskId: string,
  projectId: string,
  userId: string | null,
): Promise<TeamsEventData | null> {
  const [taskRow] = await db
    .select({
      title: taskTable.title,
      number: taskTable.number,
      status: taskTable.status,
      priority: taskTable.priority,
      projectName: projectTable.name,
      projectId: projectTable.id,
      workspaceId: workspaceTable.id,
      columnName: columnTable.name,
      assigneeLocale: userTable.locale,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .innerJoin(workspaceTable, eq(projectTable.workspaceId, workspaceTable.id))
    .leftJoin(
      columnTable,
      and(
        eq(columnTable.projectId, projectTable.id),
        eq(columnTable.slug, taskTable.status),
      ),
    )
    .leftJoin(userTable, eq(userTable.id, taskTable.userId))
    .where(and(eq(taskTable.id, taskId), eq(taskTable.projectId, projectId)))
    .limit(1);

  if (!taskRow) return null;

  const actor = await getActor(userId);
  const clientUrl = process.env.KANEO_CLIENT_URL || "http://localhost:5173";
  return {
    taskTitle: taskRow.title,
    taskNumber: taskRow.number,
    projectName: taskRow.projectName,
    taskUrl: `${clientUrl}/dashboard/workspace/${taskRow.workspaceId}/project/${taskRow.projectId}/task/${taskId}`,
    actorName: actor.name,
    status: taskRow.status,
    columnName: taskRow.columnName,
    priority: taskRow.priority,
    locale: (userId ? actor.locale : null) ?? taskRow.assigneeLocale,
  };
}

function toCard(title: string, body: string, data: TeamsEventData): TeamsCard {
  const copy = teamsCardCopy(data.locale);
  const issueKey =
    data.taskNumber !== null ? `#${data.taskNumber}` : copy.labels.task;
  return {
    title,
    body,
    taskLabel: `${issueKey} ${data.taskTitle}`,
    taskUrl: data.taskUrl,
    projectName: data.projectName,
    status: copy.status(data.status, data.columnName),
    priority: copy.priority(data.priority),
    actorName: data.actorName,
    labels: copy.labels,
  };
}

async function postCard(
  config: TeamsConfig,
  card: TeamsCard,
): Promise<boolean> {
  try {
    await postToTeams(config.webhookUrl, card);
    return true;
  } catch (error) {
    console.error("sendTeamsMessage postToTeams failed", {
      error: safeOutboundError(error),
    });
    return false;
  }
}

async function deliver(
  context: PluginContext,
  key: TeamsEventKey,
  taskId: string,
  projectId: string,
  userId: string | null,
  message: (data: TeamsEventData) => { title: string; body: string },
): Promise<void> {
  const config = normalizeTeamsConfig(context.config as TeamsConfig);
  if (!isEnabled(config, key)) return;
  const data = await getTeamsEventData(taskId, projectId, userId);
  if (!data) return;
  const { title, body } = message(data);
  await postCard(config, toCard(title, body, data));
}

export async function handleTaskCreated(
  event: TaskCreatedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskCreated",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.taskCreatedTitle,
        body: copy.taskCreatedBody(event.title),
      };
    },
  );
}

export async function handleTaskStatusChanged(
  event: TaskStatusChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskStatusChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.statusChangedTitle,
        body: copy.statusChangedBody(
          event.title,
          copy.status(event.oldStatus, null),
          copy.status(
            event.newStatus,
            data.status === event.newStatus ? data.columnName : null,
          ),
        ),
      };
    },
  );
}

export async function handleTaskPriorityChanged(
  event: TaskPriorityChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskPriorityChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.priorityChangedTitle,
        body: copy.priorityChangedBody(
          event.title,
          copy.priority(event.oldPriority),
          copy.priority(event.newPriority),
        ),
      };
    },
  );
}

export async function handleTaskTitleChanged(
  event: TaskTitleChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskTitleChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.titleChangedTitle,
        body: copy.titleChangedBody(
          truncate(event.oldTitle, 120),
          truncate(event.newTitle, 120),
        ),
      };
    },
  );
}

export async function handleTaskDescriptionChanged(
  event: TaskDescriptionChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskDescriptionChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      const preview = event.newDescription
        ? truncate(event.newDescription, 160)
        : "";
      return {
        title: copy.descriptionChangedTitle,
        body: preview
          ? copy.descriptionChangedBodyWithPreview(preview)
          : copy.descriptionChangedBody,
      };
    },
  );
}

export async function handleTaskCommentCreated(
  event: TaskCommentCreatedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskCommentCreated",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => ({
      title: teamsCardCopy(data.locale).commentTitle,
      body: truncate(event.comment, 200),
    }),
  );
}

export async function handleTaskDeleted(
  event: TaskDeletedEvent,
  context: PluginContext,
): Promise<void> {
  const config = normalizeTeamsConfig(context.config as TeamsConfig);
  if (!isEnabled(config, "taskDeleted")) return;

  const [project] = await db
    .select({ name: projectTable.name })
    .from(projectTable)
    .where(eq(projectTable.id, event.projectId))
    .limit(1);
  if (!project) return;

  const actor = await getActor(event.userId);
  const copy = teamsCardCopy(actor.locale);
  await postCard(config, {
    title: copy.deletedTitle,
    body: copy.deletedBody(event.title),
    taskLabel: event.title,
    taskUrl: null,
    projectName: project.name,
    status: copy.deleted,
    priority: copy.unknown,
    actorName: actor.name,
    labels: copy.labels,
  });
}

export async function handleTaskMoved(
  event: TaskMovedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskMoved",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.movedTitle,
        body: copy.movedBody(event.fromProjectName, event.toProjectName),
      };
    },
  );
}

export async function handleTaskDueDateChanged(
  event: TaskDueDateChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskDueDateChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.dueChangedTitle,
        body: copy.dueChangedBody(
          event.title,
          formatDue(event.oldDueDate, copy.none),
          formatDue(event.newDueDate, copy.none),
        ),
      };
    },
  );
}

export async function handleTaskAssigneeChanged(
  event: TaskAssigneeChangedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskAssigneeChanged",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.assigneeChangedTitle,
        body: copy.assigneeChangedBody(
          event.title,
          event.newAssignee ?? copy.someone,
        ),
      };
    },
  );
}

export async function handleTaskUnassigned(
  event: TaskUnassignedEvent,
  context: PluginContext,
): Promise<void> {
  await deliver(
    context,
    "taskUnassigned",
    event.taskId,
    event.projectId,
    event.userId,
    (data) => {
      const copy = teamsCardCopy(data.locale);
      return {
        title: copy.unassignedTitle,
        body: copy.unassignedBody(event.title),
      };
    },
  );
}

export async function sendTeamsDueDateReminder(
  config: TeamsConfig,
  taskId: string,
  projectId: string,
  leadTimeMinutes: number,
  _dueDate: Date,
): Promise<boolean> {
  const normalized = normalizeTeamsConfig(config);
  if (!isEnabled(normalized, "dueDateReminder")) return false;
  const data = await getTeamsEventData(taskId, projectId, null);
  if (!data) return false;
  const copy = teamsCardCopy(data.locale);
  return postCard(
    normalized,
    toCard(
      copy.dueSoonTitle,
      copy.dueSoonBody(data.taskTitle, copy.leadTime(leadTimeMinutes)),
      data,
    ),
  );
}
