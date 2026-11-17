import { and, eq, inArray, sql } from "drizzle-orm";
import { columnTable, taskRelationTable, taskTable } from "../database/schema";
import { ApiError, type TaskBlocker } from "../errors/api-error";
import type { DbOrTx } from "../project-access/db-or-tx";
import { taskIsCompleted } from "./task-is-completed";

export type CompletionMove = {
  taskId: string;
  projectId: string;
  currentStatus: string;
  nextStatus: string;
};

export async function assertCanCompleteTasks(
  dbOrTx: DbOrTx,
  moves: CompletionMove[],
) {
  const changed = moves.filter(
    (move) => move.currentStatus !== move.nextStatus,
  );
  if (changed.length === 0) return;

  const projectIds = [...new Set(changed.map((move) => move.projectId))];
  const columns = await dbOrTx
    .select({
      projectId: columnTable.projectId,
      slug: columnTable.slug,
      isFinal: columnTable.isFinal,
    })
    .from(columnTable)
    .where(inArray(columnTable.projectId, projectIds));

  const isFinal = new Map(
    columns.map((column) => [
      `${column.projectId}:${column.slug}`,
      column.isFinal,
    ]),
  );

  const completingIds = [
    ...new Set(
      changed
        .filter(
          (move) =>
            isFinal.get(`${move.projectId}:${move.nextStatus}`) &&
            !isFinal.get(`${move.projectId}:${move.currentStatus}`),
        )
        .map((move) => move.taskId),
    ),
  ];
  if (completingIds.length === 0) return;

  const blockers = await dbOrTx
    .select({
      id: taskTable.id,
      title: taskTable.title,
      number: taskTable.number,
      projectId: taskTable.projectId,
      status: taskTable.status,
    })
    .from(taskRelationTable)
    .innerJoin(taskTable, eq(taskRelationTable.sourceTaskId, taskTable.id))
    .where(
      and(
        eq(taskRelationTable.relationType, "blocks"),
        inArray(taskRelationTable.targetTaskId, completingIds),
        sql`not (${taskIsCompleted})`,
      ),
    );

  if (blockers.length === 0) return;

  const unique = new Map<string, TaskBlocker>();
  for (const blocker of blockers) {
    unique.set(blocker.id, blocker);
  }

  throw new ApiError(409, {
    message: "This task is blocked by unfinished work",
    code: "TASK_BLOCKED",
    blockers: [...unique.values()],
  });
}
