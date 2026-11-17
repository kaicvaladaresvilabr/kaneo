import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import TaskBlockedDialog from "./task-blocked-dialog";
import { useTaskBlockedDialogStore } from "./task-blocked-dialog-store";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: {
    workspaceId: "workspace-1",
    projectId: "project-1",
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  useParams: ({
    select,
  }: {
    select: (params: typeof mocks.params) => unknown;
  }) => select(mocks.params),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { title?: string }) =>
      options?.title ? `${key}:${options.title}` : key,
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));
vi.mock("@/hooks/queries/workspace/use-active-workspace", () => ({
  default: () => ({ data: { id: "workspace-1" } }),
}));
vi.mock("@/hooks/queries/project/use-get-projects", () => ({
  default: () => ({
    data: [
      { id: "project-1", slug: "APP" },
      { id: "project-2", slug: "ENG" },
    ],
  }),
}));
vi.mock("@/lib/i18n/domain", () => ({
  getStatusLabel: (status: string) => status,
}));

const sameProjectBlocker = {
  id: "blocker-1",
  title: "Write the spec",
  number: 12,
  projectId: "project-1",
  status: "to-do",
};

const otherProjectBlocker = {
  id: "blocker-2",
  title: "Review the API",
  number: 4,
  projectId: "project-2",
  status: "in-progress",
};

afterEach(() => {
  cleanup();
  mocks.navigate.mockReset();
  mocks.params.projectId = "project-1";
  useTaskBlockedDialogStore.getState().close();
});

describe("TaskBlockedDialog", () => {
  it("lists unfinished blockers", () => {
    useTaskBlockedDialogStore.getState().open([sameProjectBlocker]);
    render(<TaskBlockedDialog />);

    expect(screen.getByText("tasks:blocked.title")).toBeVisible();
    expect(screen.getByText("APP-12")).toBeVisible();
    expect(screen.getByText("Write the spec")).toBeVisible();
    expect(screen.getByText("to-do")).toBeVisible();
  });

  it("opens a same-project blocker in the current view", () => {
    useTaskBlockedDialogStore.getState().open([sameProjectBlocker]);
    render(<TaskBlockedDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "tasks:blocked.openTask:Write the spec",
      }),
    );

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: ".",
      search: { taskId: "blocker-1" },
    });
  });

  it("opens a blocker from another project on that board", () => {
    useTaskBlockedDialogStore.getState().open([otherProjectBlocker]);
    render(<TaskBlockedDialog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "tasks:blocked.openTask:Review the API",
      }),
    );

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/board",
      params: { workspaceId: "workspace-1", projectId: "project-2" },
      search: { taskId: "blocker-2" },
    });
  });
});
