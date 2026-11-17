import { and, eq, inArray, sql } from "drizzle-orm";
import { projectTable, taskRelationTable, taskTable } from "../database/schema";
import { projectAccessCondition } from "../project-access/project-access-condition";
import type { TaskReadDatabase } from "./bounded-read";
import { taskIsCompleted } from "./task-is-completed";

/** Incoming `blocks` progress for the page, independent of board filters. */
export async function getBlockerCounts(
  db: TaskReadDatabase,
  taskIds: string[],
  workspaceId: string,
  publicOnly: boolean,
  userId?: string,
) {
  if (taskIds.length === 0) {
    return new Map<string, { completed: number; total: number }>();
  }

  const rows = await db
    .select({
      taskId: taskRelationTable.targetTaskId,
      total: sql<number>`count(distinct ${taskTable.id})`.mapWith(Number),
      completed:
        sql<number>`count(distinct ${taskTable.id}) filter (where ${taskIsCompleted})`.mapWith(
          Number,
        ),
    })
    .from(taskRelationTable)
    .innerJoin(taskTable, eq(taskRelationTable.sourceTaskId, taskTable.id))
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        inArray(taskRelationTable.targetTaskId, taskIds),
        eq(taskRelationTable.relationType, "blocks"),
        eq(projectTable.workspaceId, workspaceId),
        publicOnly ? eq(projectTable.isPublic, true) : undefined,
        userId ? projectAccessCondition(userId, projectTable.id) : undefined,
      ),
    )
    .groupBy(taskRelationTable.targetTaskId);

  return new Map(
    rows.map(({ taskId, completed, total }) => [taskId, { completed, total }]),
  );
}
