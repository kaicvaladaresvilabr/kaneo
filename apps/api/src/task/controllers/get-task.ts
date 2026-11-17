import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  projectTable,
  taskRelationTable,
  taskTable,
  userTable,
} from "../../database/schema";
import { boundedTaskRead } from "../bounded-read";
import { boardDescription, descriptionDeferred } from "../description-pages";
import { getBlockerCounts } from "../get-blocker-counts";
import { getBlockingCounts } from "../get-blocking-counts";
import { getSubtaskCounts } from "../get-subtask-counts";

async function getTask(taskId: string, board = false, userId?: string) {
  const task = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      description: board ? boardDescription : taskTable.description,
      ...(board
        ? {
            descriptionDeferred,
          }
        : {}),
      status: taskTable.status,
      columnId: taskTable.columnId,
      priority: taskTable.priority,
      startDate: taskTable.startDate,
      dueDate: taskTable.dueDate,
      recurrence: taskTable.recurrence,
      position: taskTable.position,
      createdAt: taskTable.createdAt,
      userId: taskTable.userId,
      assigneeName: userTable.name,
      assigneeId: userTable.id,
      projectId: taskTable.projectId,
      workspaceId: sql<string>`(select ${projectTable.workspaceId} from ${projectTable} where ${projectTable.id} = ${taskTable.projectId})`,
    })
    .from(taskTable)
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task.length || !task[0]) {
    throw new HTTPException(404, {
      message: "Task not found",
    });
  }

  if (!board) return task[0];
  const { workspaceId, ...result } = task[0];
  if (!workspaceId) return result;
  const parent = alias(taskTable, "parent");
  const blocked = alias(taskTable, "blocked");
  const blocker = alias(taskTable, "blocker");
  const parents = await db
    .selectDistinct({ id: parent.id })
    .from(taskRelationTable)
    .innerJoin(parent, eq(taskRelationTable.sourceTaskId, parent.id))
    .where(
      and(
        eq(taskRelationTable.targetTaskId, taskId),
        eq(taskRelationTable.relationType, "subtask"),
        eq(parent.projectId, result.projectId),
      ),
    );
  const blockedTargets = await db
    .selectDistinct({ id: blocked.id })
    .from(taskRelationTable)
    .innerJoin(blocked, eq(taskRelationTable.targetTaskId, blocked.id))
    .where(
      and(
        eq(taskRelationTable.sourceTaskId, taskId),
        eq(taskRelationTable.relationType, "blocks"),
        eq(blocked.projectId, result.projectId),
      ),
    );
  const blockingSources = await db
    .selectDistinct({ id: blocker.id })
    .from(taskRelationTable)
    .innerJoin(blocker, eq(taskRelationTable.sourceTaskId, blocker.id))
    .where(
      and(
        eq(taskRelationTable.targetTaskId, taskId),
        eq(taskRelationTable.relationType, "blocks"),
        eq(blocker.projectId, result.projectId),
      ),
    );
  const relatedIds = [
    taskId,
    ...parents.map((task) => task.id),
    ...blockedTargets.map((task) => task.id),
    ...blockingSources.map((task) => task.id),
  ];
  const [subtaskCounts, blockerCounts, blockingCounts] = await boundedTaskRead(
    (tx) =>
      Promise.all([
        getSubtaskCounts(tx, relatedIds, workspaceId, false, userId),
        getBlockerCounts(tx, relatedIds, workspaceId, false, userId),
        getBlockingCounts(tx, relatedIds, workspaceId, false, userId),
      ]),
  );
  return {
    ...result,
    subtaskCounts: subtaskCounts.get(taskId) ?? { completed: 0, total: 0 },
    parentSubtaskCounts: parents.map(({ id }) => ({
      taskId: id,
      ...(subtaskCounts.get(id) ?? { completed: 0, total: 0 }),
    })),
    blockerCounts: blockerCounts.get(taskId) ?? { completed: 0, total: 0 },
    blockedTargetCounts: blockedTargets.map(({ id }) => ({
      taskId: id,
      ...(blockerCounts.get(id) ?? { completed: 0, total: 0 }),
    })),
    blockingCounts: blockingCounts.get(taskId) ?? { completed: 0, total: 0 },
    blockingSourceCounts: blockingSources.map(({ id }) => ({
      taskId: id,
      ...(blockingCounts.get(id) ?? { completed: 0, total: 0 }),
    })),
  };
}

export default getTask;
