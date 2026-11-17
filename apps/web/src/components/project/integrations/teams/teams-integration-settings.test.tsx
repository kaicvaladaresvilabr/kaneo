import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { toGenericWebhookEvents } from "@/components/project/integrations/generic-webhook/generic-webhook-events";
import { TeamsIntegrationSettings } from "./teams-integration-settings";

const mocks = vi.hoisted(() => ({
  integration: null as unknown,
  createIntegration: vi.fn(),
  updateIntegration: vi.fn(),
  deleteIntegration: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      values ? `${key} ${Object.values(values).join(" ")}` : key,
  }),
}));

vi.mock("@/hooks/queries/teams-integration/use-get-teams-integration", () => ({
  default: () => ({ data: mocks.integration, isLoading: false }),
}));

vi.mock("@/hooks/mutations/teams-integration/use-teams-integration", () => ({
  useCreateTeamsIntegration: () => ({
    mutateAsync: mocks.createIntegration,
    isPending: false,
  }),
  useUpdateTeamsIntegration: () => ({
    mutateAsync: mocks.updateIntegration,
    isPending: false,
  }),
  useDeleteTeamsIntegration: () => ({
    mutateAsync: mocks.deleteIntegration,
    isPending: false,
  }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("TeamsIntegrationSettings", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.integration = null;
    mocks.createIntegration.mockReset().mockResolvedValue(undefined);
    mocks.updateIntegration.mockReset().mockResolvedValue(undefined);
    mocks.deleteIntegration.mockReset().mockResolvedValue(undefined);
  });

  it("lists all twelve events and shows reminder timing only when reminders are on", () => {
    render(<TeamsIntegrationSettings projectId="project-1" />);

    expect(
      within(
        screen.getByRole("group", {
          name: "settings:genericWebhookIntegration.eventsTitle",
        }),
      ).getAllByRole("checkbox"),
    ).toHaveLength(12);
    expect(
      screen.queryByLabelText(
        "settings:genericWebhookIntegration.reminderLeadTimeLabel",
      ),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "settings:genericWebhookIntegration.events.dueDateReminder",
      }),
    );

    expect(
      screen.getByLabelText(
        "settings:genericWebhookIntegration.reminderLeadTimeLabel",
      ),
    ).toBeInTheDocument();
  });

  it("saves the reminder lead time in minutes", async () => {
    mocks.integration = {
      id: "integration-1",
      projectId: "project-1",
      channelName: "Obras",
      webhookConfigured: true,
      maskedWebhookUrl: "https://prod…voke",
      events: toGenericWebhookEvents({ dueDateReminder: true }),
      dueDateReminderLeadTimeMinutes: 24 * 60,
      isActive: true,
      createdAt: "",
      updatedAt: "",
    };
    render(<TeamsIntegrationSettings projectId="project-1" />);

    fireEvent.change(
      screen.getByLabelText(
        "settings:genericWebhookIntegration.reminderLeadTimeLabel",
      ),
      { target: { value: "18" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings:chatIntegrations.saveChanges",
      }),
    );

    await waitFor(() =>
      expect(mocks.updateIntegration).toHaveBeenCalledWith({
        projectId: "project-1",
        json: expect.objectContaining({
          dueDateReminderLeadTimeMinutes: 18 * 60,
          events: expect.objectContaining({ dueDateReminder: true }),
        }),
      }),
    );
  });
});
