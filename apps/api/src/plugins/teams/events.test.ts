import { inspect } from "node:util";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { OutboundRequestError } from "../../utils/outbound-request";
import { handleTaskCreated } from "./events";

const mocks = vi.hoisted(() => ({ select: vi.fn(), post: vi.fn() }));

vi.mock("../../database", () => ({ default: { select: mocks.select } }));
vi.mock("./client", () => ({ postToTeams: mocks.post }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

function selectChain(rows: unknown[]) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    limit: async () => rows,
  };
  return chain;
}

describe("Teams delivery error logging", () => {
  it("omits the webhook URL when posting fails", async () => {
    const webhookUrl =
      "https://prod-00.westus.logic.azure.com/workflows/private-workflow/triggers/manual/paths/invoke?sig=private-signature";
    const error = new OutboundRequestError("http", 503);
    error.stack = `private-stack ${webhookUrl}`;
    mocks.post.mockRejectedValueOnce(error);
    mocks.select
      .mockReturnValueOnce(
        selectChain([
          {
            title: "Cura radier",
            number: 4,
            status: "to-do",
            priority: "low",
            projectName: "Obra",
            workspaceId: "workspace",
            projectId: "project",
          },
        ]),
      )
      .mockReturnValueOnce(selectChain([{ name: "Kaic" }]));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await handleTaskCreated(
      {
        taskId: "task",
        projectId: "project",
        userId: "user",
        title: "Cura radier",
        description: null,
        priority: null,
        status: "to-do",
        number: 4,
      },
      {
        integrationId: "integration",
        projectId: "project",
        config: { webhookUrl, events: { taskCreated: true } },
      },
    );

    expect(log).toHaveBeenCalledExactlyOnceWith(
      "sendTeamsMessage postToTeams failed",
      { error: "Outbound request failed: http (HTTP 503)" },
    );
    const output = inspect(log.mock.calls, { depth: null });
    expect(output).not.toContain("private-workflow");
    expect(output).not.toContain("private-signature");
    expect(output).not.toContain("private-stack");
  });
});
