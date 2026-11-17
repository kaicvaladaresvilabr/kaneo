import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { checkProjectWebhookReminders } from "./project-webhook-reminders";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  sendWebhook: vi.fn(),
  sendTeams: vi.fn(),
}));

vi.mock("../database", () => ({
  default: {
    select: mocks.select,
    insert: mocks.insert,
    delete: mocks.delete,
  },
}));
vi.mock("../plugins/generic-webhook/events", () => ({
  sendDueDateReminder: mocks.sendWebhook,
}));
vi.mock("../plugins/teams/events", () => ({
  sendTeamsDueDateReminder: mocks.sendTeams,
}));

afterEach(() => {
  vi.clearAllMocks();
});

function rows(result: unknown[]) {
  const chain = {
    from: () => chain,
    leftJoin: () => chain,
    where: () => Promise.resolve(result),
  };
  return chain;
}

describe("project reminder delivery", () => {
  it("posts a Teams reminder with its own lead time and drops the claim when posting fails", async () => {
    const dueDate = new Date("2026-11-20T00:00:00.000Z");
    mocks.select
      .mockReturnValueOnce(rows([]))
      .mockReturnValueOnce(
        rows([
          {
            id: "teams-integration",
            projectId: "project",
            config: JSON.stringify({
              webhookUrl:
                "https://prod-00.westus.logic.azure.com/workflows/abc/triggers/manual/paths/invoke?sig=secret",
              events: { dueDateReminder: true },
              dueDateReminderLeadTimeMinutes: 18 * 60,
            }),
          },
        ]),
      )
      .mockReturnValueOnce(rows([{ id: "task", dueDate }]));
    mocks.insert.mockReturnValue({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => [{ id: "claim" }],
        }),
      }),
    });
    mocks.delete.mockReturnValue({ where: async () => undefined });
    mocks.sendTeams.mockResolvedValue(false);

    await expect(checkProjectWebhookReminders()).resolves.toEqual({
      degraded: false,
    });

    expect(mocks.sendWebhook).not.toHaveBeenCalled();
    expect(mocks.sendTeams).toHaveBeenCalledWith(
      expect.objectContaining({ dueDateReminderLeadTimeMinutes: 1080 }),
      "task",
      "project",
      1080,
      dueDate,
    );
    expect(mocks.delete).toHaveBeenCalledOnce();
  });
});
