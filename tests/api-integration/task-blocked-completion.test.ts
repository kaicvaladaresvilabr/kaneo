import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import db, { schema } from "../../apps/api/src/database";
import { createApp } from "../../apps/api/src/index";
import bulkUpdateTasks from "../../apps/api/src/task/controllers/bulk-update-tasks";
import moveTask from "../../apps/api/src/task/controllers/move-task";
import reorderTasks from "../../apps/api/src/task/controllers/reorder-tasks";
import { mockAuthenticatedSession } from "./helpers/auth";
import { resetTestDatabase } from "./helpers/database";
import { readErrorBody } from "./helpers/error-body";
import {
  createProjectFixture,
  createWorkspaceMember,
} from "./helpers/fixtures";

const m = vi.hoisted(() => ({ publish: vi.fn(async () => undefined) }));
vi.mock("../../apps/api/src/events", async (original) => ({
  ...(await original<object>()),
  publishEvent: m.publish,
}));

beforeEach(async () => {
  await resetTestDatabase();
  vi.clearAllMocks();
});

async function seed() {
  const member = await createWorkspaceMember();
  const { project, columns } = await createProjectFixture({
    workspaceId: member.workspace.id,
  });
  mockAuthenticatedSession(member.user);
  return { member, project, columns, app: createApp().app };
}

async function insertTask(
  projectId: string,
  columnId: string,
  title: string,
  number: number,
  status = "to-do",
) {
  const [task] = await db
    .insert(schema.taskTable)
    .values({
      projectId,
      columnId,
      title,
      status,
      number,
      position: number,
    })
    .returning();
  return task;
}

async function link(
  sourceTaskId: string,
  targetTaskId: string,
  relationType: "blocks" | "related" | "subtask",
) {
  await db.insert(schema.taskRelationTable).values({
    sourceTaskId,
    targetTaskId,
    relationType,
  });
}

function request(
  app: ReturnType<typeof createApp>["app"],
  method: string,
  path: string,
  body: unknown,
) {
  return app.request(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("blocked task completion", () => {
  it("rejects completing a task while an incoming blocker is open", async () => {
    const { app, project, columns } = await seed();
    const blocker = await insertTask(
      project.id,
      columns.todo.id,
      "Write the spec",
      1,
    );
    const blocked = await insertTask(
      project.id,
      columns.todo.id,
      "Ship the feature",
      2,
    );
    await link(blocker.id, blocked.id, "blocks");

    const response = await request(
      app,
      "PUT",
      `/api/task/status/${blocked.id}`,
      { status: "done" },
    );

    expect(response.status).toBe(409);
    expect(await readErrorBody(response)).toMatchObject({
      code: "TASK_BLOCKED",
      message: "This task is blocked by unfinished work",
      blockers: [
        {
          id: blocker.id,
          title: "Write the spec",
          number: 1,
          projectId: project.id,
          status: "to-do",
        },
      ],
    });
    expect(
      await db.query.taskTable.findFirst({
        where: eq(schema.taskTable.id, blocked.id),
      }),
    ).toMatchObject({ status: "to-do" });
  });

  it("allows completion after the blocker is in a final column", async () => {
    const { app, project, columns } = await seed();
    const blocker = await insertTask(
      project.id,
      columns.todo.id,
      "Write the spec",
      1,
    );
    const blocked = await insertTask(
      project.id,
      columns.todo.id,
      "Ship the feature",
      2,
    );
    await link(blocker.id, blocked.id, "blocks");

    expect(
      (
        await request(app, "PUT", `/api/task/status/${blocker.id}`, {
          status: "done",
        })
      ).status,
    ).toBe(200);

    const response = await request(
      app,
      "PUT",
      `/api/task/status/${blocked.id}`,
      { status: "done" },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: blocked.id,
      status: "done",
    });
  });

  it("does not treat related or outgoing blocks as completion blockers", async () => {
    const { app, project, columns } = await seed();
    const related = await insertTask(
      project.id,
      columns.todo.id,
      "Related work",
      1,
    );
    const outgoing = await insertTask(
      project.id,
      columns.todo.id,
      "Depends on this",
      2,
    );
    const task = await insertTask(
      project.id,
      columns.todo.id,
      "Ready to close",
      3,
    );
    await link(related.id, task.id, "related");
    await link(task.id, outgoing.id, "blocks");

    const response = await request(app, "PUT", `/api/task/status/${task.id}`, {
      status: "done",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: task.id,
      status: "done",
    });
  });

  it("leaves the board unchanged when a reorder into a final column is blocked", async () => {
    const { member, project, columns } = await seed();
    const blocker = await insertTask(
      project.id,
      columns.todo.id,
      "Write the spec",
      1,
    );
    const blocked = await insertTask(
      project.id,
      columns.todo.id,
      "Ship the feature",
      2,
    );
    await link(blocker.id, blocked.id, "blocks");

    await expect(
      reorderTasks(
        project.id,
        [{ id: blocked.id, position: 1, status: "done" }],
        member.user.id,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: "TASK_BLOCKED",
      blockers: [expect.objectContaining({ id: blocker.id })],
    });
    expect(
      await db.query.taskTable.findFirst({
        where: eq(schema.taskTable.id, blocked.id),
      }),
    ).toMatchObject({ status: "to-do", position: 2 });
  });

  it("rejects a bulk complete when any selected task is blocked", async () => {
    const { member, project, columns } = await seed();
    const blocker = await insertTask(
      project.id,
      columns.todo.id,
      "Write the spec",
      1,
    );
    const blocked = await insertTask(
      project.id,
      columns.todo.id,
      "Ship the feature",
      2,
    );
    const other = await insertTask(
      project.id,
      columns.todo.id,
      "Unrelated work",
      3,
    );
    await link(blocker.id, blocked.id, "blocks");

    await expect(
      bulkUpdateTasks({
        taskIds: [blocked.id, other.id],
        operation: "updateStatus",
        value: "done",
        userId: member.user.id,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "TASK_BLOCKED",
      blockers: [expect.objectContaining({ id: blocker.id })],
    });
    const statuses = Object.fromEntries(
      (await db.query.taskTable.findMany()).map((task) => [
        task.id,
        task.status,
      ]),
    );
    expect(statuses).toEqual({
      [blocker.id]: "to-do",
      [blocked.id]: "to-do",
      [other.id]: "to-do",
    });
  });

  it("rejects moving a blocked task into a final destination column", async () => {
    const { member, project, columns } = await seed();
    const destination = await createProjectFixture({
      workspaceId: member.workspace.id,
    });
    const blocker = await insertTask(
      project.id,
      columns.todo.id,
      "Write the spec",
      1,
    );
    const blocked = await insertTask(
      project.id,
      columns.todo.id,
      "Ship the feature",
      2,
    );
    await link(blocker.id, blocked.id, "blocks");

    await expect(
      moveTask({
        taskId: blocked.id,
        destinationProjectId: destination.project.id,
        destinationStatus: "done",
        currentUserId: member.user.id,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "TASK_BLOCKED",
      blockers: [expect.objectContaining({ id: blocker.id })],
    });
    expect(
      await db.query.taskTable.findFirst({
        where: eq(schema.taskTable.id, blocked.id),
      }),
    ).toMatchObject({ projectId: project.id, status: "to-do" });
  });
});
