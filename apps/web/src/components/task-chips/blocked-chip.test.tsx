import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type Task from "@/types/task";
import { BlockedChip } from "./blocked-chip";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count != null ? `${key}:${options.count}` : key,
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

const task: Task = {
  id: "task-1",
  title: "Blocked task",
  number: 1,
  description: null,
  status: "to-do",
  priority: null,
  startDate: null,
  dueDate: null,
  position: 1,
  createdAt: "2026-08-05T00:00:00.000Z",
  userId: null,
  assigneeId: null,
  assigneeName: null,
  projectId: "project-1",
};

afterEach(cleanup);

describe("BlockedChip", () => {
  it("hides when there are no open blockers", () => {
    const { rerender } = render(
      <BlockedChip task={task} workspaceId="workspace-1" />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <BlockedChip
        task={{ ...task, blockerCounts: { completed: 0, total: 0 } }}
        workspaceId="workspace-1"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <BlockedChip
        task={{ ...task, blockerCounts: { completed: 2, total: 2 } }}
        workspaceId="workspace-1"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the remaining open blocker count", () => {
    render(
      <BlockedChip
        task={{ ...task, blockerCounts: { completed: 1, total: 3 } }}
        workspaceId="workspace-1"
      />,
    );
    const chip = screen.getByRole("button", {
      name: "tasks:blocked.openCount:2",
    });
    expect(chip).toHaveTextContent("2");
    expect(chip).toHaveAttribute("title", "tasks:blocked.openCount:2");
  });
});
