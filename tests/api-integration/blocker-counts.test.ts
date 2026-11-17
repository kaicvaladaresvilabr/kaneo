import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import getTasks from "../../apps/api/src/task/controllers/get-tasks";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

async function addTask(projectId: string, status = "to-do") {
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      title: "Task",
      status,
      number: null,
    })
    .returning();
  return task;
}

async function relate(
  sourceTaskId: string,
  targetTaskId: string,
  relationType = "blocks",
) {
  await db.insert(schema.taskRelationTable).values({
    sourceTaskId,
    targetTaskId,
    relationType,
  });
}

async function boardTask(projectId: string, taskId: string) {
  const { data } = await getTasks(projectId);
  return [
    ...data.columns.flatMap((column) => column.tasks),
    ...data.plannedTasks,
    ...data.archivedTasks,
  ].find((task) => task.id === taskId);
}

describe("API integration: blocker counters", () => {
  beforeEach(resetTestDatabase);

  it("counts incoming blocks and ignores other relations and outgoing edges", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const target = await addTask(project.id);
    const blocker = await addTask(project.id, "in-progress");
    const doneBlocker = await addTask(project.id, "done");
    const related = await addTask(project.id);
    const child = await addTask(project.id);
    const blockedByTarget = await addTask(project.id);
    await relate(blocker.id, target.id);
    await relate(doneBlocker.id, target.id);
    await relate(related.id, target.id, "related");
    await relate(target.id, child.id, "subtask");
    await relate(target.id, blockedByTarget.id);

    expect(await boardTask(project.id, target.id)).toMatchObject({
      blockerCounts: { completed: 1, total: 2 },
      blockingCounts: { completed: 0, total: 1 },
    });
    expect(await boardTask(project.id, blocker.id)).toMatchObject({
      blockerCounts: { completed: 0, total: 0 },
      blockingCounts: { completed: 0, total: 1 },
    });
    expect(await boardTask(project.id, blockedByTarget.id)).toMatchObject({
      blockerCounts: { completed: 0, total: 1 },
      blockingCounts: { completed: 0, total: 0 },
    });
  });

  it("returns current blocker progress for board refreshes of blocking tasks", async () => {
    const member = await createWorkspaceMember();
    const { project } = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const target = await addTask(project.id);
    const blocker = await addTask(project.id, "done");
    await relate(blocker.id, target.id);
    await db
      .update(schema.taskTable)
      .set({ description: "😀".repeat(20000) })
      .where(eq(schema.taskTable.id, blocker.id));
    mockAuthenticatedSession(member.user);
    const response = await createApp().app.request(
      `/api/task/${blocker.id}?view=board`,
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      description: null,
      descriptionDeferred: true,
      blockerCounts: { completed: 0, total: 0 },
      blockingCounts: { completed: 0, total: 1 },
      blockedTargetCounts: [{ taskId: target.id, completed: 1, total: 1 }],
    });
    const targetResponse = await createApp().app.request(
      `/api/task/${target.id}?view=board`,
    );
    expect(targetResponse.status).toBe(200);
    expect(await targetResponse.json()).toMatchObject({
      blockerCounts: { completed: 1, total: 1 },
      blockingCounts: { completed: 0, total: 0 },
      blockingSourceCounts: [{ taskId: blocker.id, completed: 0, total: 1 }],
    });
  });
});
