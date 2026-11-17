import { describe, expect, it, vi } from "vite-plus/test";
import { buildTeamsPayload } from "./client";
import {
  isTeamsWebhookUrl,
  maskTeamsWebhookUrl,
  normalizeTeamsConfig,
  validateTeamsConfig,
} from "./config";

vi.mock("../generic-webhook/config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../generic-webhook/config")>();
  return {
    ...actual,
    assertPublicWebhookDestination: vi.fn(),
  };
});

const workflowUrl =
  "https://prod-00.westus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke?sig=secret";
const officeUrl =
  "https://example.webhook.office.com/webhookb2/abc/IncomingWebhook/def";

const card = {
  title: "New task created",
  body: "A new task was added: Cura radier",
  taskLabel: "#4 Cura radier",
  taskUrl: "https://kaneo.example/task/4",
  projectName: "Obra",
  status: "To Do",
  priority: "No Priority",
  actorName: "Kaic",
};

describe("Teams webhook config", () => {
  it("accepts workflow and connector URLs and rejects other hosts", async () => {
    expect(isTeamsWebhookUrl(workflowUrl)).toBe(true);
    expect(
      isTeamsWebhookUrl(
        "https://org.region.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/abc/triggers/manual/paths/invoke?sig=secret",
      ),
    ).toBe(true);
    expect(isTeamsWebhookUrl(officeUrl)).toBe(true);
    expect(
      isTeamsWebhookUrl("https://hooks.slack.com/services/T000/B000/XXXX"),
    ).toBe(false);
    expect(isTeamsWebhookUrl("http://logic.azure.com/workflows/a")).toBe(false);
    expect(maskTeamsWebhookUrl(workflowUrl)).toBe(
      "https://prod-00.westus.logic.azure.com/workflows/abc/triggers/manual/paths/••••?…",
    );
    expect(maskTeamsWebhookUrl(workflowUrl)).not.toContain("sig=");

    await expect(
      validateTeamsConfig({ webhookUrl: workflowUrl }),
    ).resolves.toEqual({ valid: true });
    await expect(
      validateTeamsConfig({
        webhookUrl: "https://hooks.slack.com/services/T000/B000/XXXX",
      }),
    ).resolves.toMatchObject({ valid: false });
  });

  it("stores a 24 hour reminder lead time unless one is provided", () => {
    expect(
      normalizeTeamsConfig({ webhookUrl: workflowUrl })
        .dueDateReminderLeadTimeMinutes,
    ).toBe(1440);
    expect(
      normalizeTeamsConfig({
        webhookUrl: workflowUrl,
        dueDateReminderLeadTimeMinutes: 18 * 60,
        events: { dueDateReminder: true },
      }).dueDateReminderLeadTimeMinutes,
    ).toBe(1080);
  });
});

describe("Teams message payload", () => {
  it("sends an Adaptive Card to a workflow and a MessageCard to an Office connector", () => {
    const workflow = buildTeamsPayload(workflowUrl, card);
    expect(workflow).toMatchObject({
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: { type: "AdaptiveCard", version: "1.4" },
        },
      ],
    });

    const connector = buildTeamsPayload(officeUrl, card);
    expect(connector).toMatchObject({
      "@type": "MessageCard",
      title: "New task created",
      potentialAction: [
        {
          "@type": "OpenUri",
          targets: [{ os: "default", uri: card.taskUrl }],
        },
      ],
    });
  });
});
