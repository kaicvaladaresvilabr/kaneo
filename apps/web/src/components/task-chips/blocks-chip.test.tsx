import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type Task from "@/types/task";
import { BlocksChip } from "./blocks-chip";

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
  title: "Blocking task",
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

describe("BlocksChip", () => {
  it("hides when there are no open blocked tasks", () => {
    const { rerender } = render(
      <BlocksChip task={task} workspaceId="workspace-1" />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <BlocksChip
        task={{ ...task, blockingCounts: { completed: 0, total: 0 } }}
        workspaceId="workspace-1"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <BlocksChip
        task={{ ...task, blockingCounts: { completed: 2, total: 2 } }}
        workspaceId="workspace-1"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the remaining open blocked-task count", () => {
    render(
      <BlocksChip
        task={{ ...task, blockingCounts: { completed: 1, total: 3 } }}
        workspaceId="workspace-1"
      />,
    );
    const chip = screen.getByRole("button", {
      name: "tasks:blocked.blocksCount:2",
    });
    expect(chip).toHaveTextContent("2");
    expect(chip).toHaveAttribute("title", "tasks:blocked.blocksCount:2");
  });
});
