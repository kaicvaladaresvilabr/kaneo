import { and, eq } from "drizzle-orm";
import db from "../../database";
import {
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
  priority: string | null;
};

function isEnabled(config: TeamsConfig, key: TeamsEventKey): boolean {
  return config.events?.[key] ?? false;
}

function toSentenceCase(value: string | null): string {
  if (!value) return "Unknown";
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function truncate(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1)}…`;
}

function formatDue(value: Date | string | null): string {
  if (!value) return "None";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "None";
  return date.toISOString().slice(0, 10);
}

function formatLeadTime(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${minutes} minutes`;
}

async function getActorName(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [user] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return user?.name ?? null;
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
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .innerJoin(workspaceTable, eq(projectTable.workspaceId, workspaceTable.id))
    .where(and(eq(taskTable.id, taskId), eq(taskTable.projectId, projectId)))
    .limit(1);

  if (!taskRow) return null;

  const clientUrl = process.env.KANEO_CLIENT_URL || "http://localhost:5173";
  return {
    taskTitle: taskRow.title,
    taskNumber: taskRow.number,
    projectName: taskRow.projectName,
    taskUrl: `${clientUrl}/dashboard/workspace/${taskRow.workspaceId}/project/${taskRow.projectId}/task/${taskId}`,
    actorName: await getActorName(userId),
    status: taskRow.status,
    priority: taskRow.priority,
  };
}

function toCard(title: string, body: string, data: TeamsEventData): TeamsCard {
  const issueKey = data.taskNumber !== null ? `#${data.taskNumber}` : "Task";
  return {
    title,
    body,
    taskLabel: `${issueKey} ${data.taskTitle}`,
    taskUrl: data.taskUrl,
    projectName: data.projectName,
    status: toSentenceCase(data.status),
    priority: toSentenceCase(data.priority),
    actorName: data.actorName,
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
  title: string,
  body: string,
): Promise<void> {
  const config = normalizeTeamsConfig(context.config as TeamsConfig);
  if (!isEnabled(config, key)) return;
  const data = await getTeamsEventData(taskId, projectId, userId);
  if (!data) return;
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
    "New task created",
    `A new task was added: ${event.title}`,
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
    "Task status changed",
    `${event.title} moved from ${toSentenceCase(event.oldStatus)} to ${toSentenceCase(event.newStatus)}.`,
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
    "Task priority changed",
    `${event.title} changed from ${toSentenceCase(event.oldPriority)} to ${toSentenceCase(event.newPriority)}.`,
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
    "Task title changed",
    `Task renamed from ${truncate(event.oldTitle, 120)} to ${truncate(event.newTitle, 120)}.`,
  );
}

export async function handleTaskDescriptionChanged(
  event: TaskDescriptionChangedEvent,
  context: PluginContext,
): Promise<void> {
  const preview = event.newDescription
    ? `: ${truncate(event.newDescription, 160)}`
    : ".";
  await deliver(
    context,
    "taskDescriptionChanged",
    event.taskId,
    event.projectId,
    event.userId,
    "Task description changed",
    `The task description was updated${preview}`,
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
    "New task comment",
    truncate(event.comment, 200),
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

  await postCard(config, {
    title: "Task deleted",
    body: `${event.title} was deleted.`,
    taskLabel: event.title,
    taskUrl: null,
    projectName: project.name,
    status: "Deleted",
    priority: "Unknown",
    actorName: await getActorName(event.userId),
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
    "Task moved",
    `Moved from ${event.fromProjectName} to ${event.toProjectName}.`,
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
    "Due date changed",
    `${event.title} due date changed from ${formatDue(event.oldDueDate)} to ${formatDue(event.newDueDate)}.`,
  );
}

export async function handleTaskAssigneeChanged(
  event: TaskAssigneeChangedEvent,
  context: PluginContext,
): Promise<void> {
  const assignee = event.newAssignee ?? "someone";
  await deliver(
    context,
    "taskAssigneeChanged",
    event.taskId,
    event.projectId,
    event.userId,
    "Assignee changed",
    `${event.title} was assigned to ${assignee}.`,
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
    "Task unassigned",
    `${event.title} no longer has an assignee.`,
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
  return postCard(
    normalized,
    toCard(
      "Task due soon",
      `${data.taskTitle} is due in ${formatLeadTime(leadTimeMinutes)}.`,
      data,
    ),
  );
}
