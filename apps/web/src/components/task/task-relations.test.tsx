import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import TaskRelations from "./task-relations";

const mocks = vi.hoisted(() => ({
  canUpdateTasks: vi.fn(),
  deleteRelation: vi.fn(),
  getRelations: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));
vi.mock("@/hooks/queries/task-relation/use-get-task-relations", () => ({
  default: () => mocks.getRelations(),
}));
vi.mock("@/hooks/queries/task/use-get-tasks", () => ({
  useGetTasks: () => ({ data: undefined }),
}));
vi.mock("@/hooks/queries/project/use-get-project", () => ({
  default: () => ({ data: { slug: "APP" } }),
}));
vi.mock("@/hooks/queries/project/use-get-projects", () => ({
  default: () => ({ data: [{ id: "project-1", slug: "APP" }] }),
}));
vi.mock("@/hooks/queries/workspace/use-active-workspace", () => ({
  default: () => ({ data: { id: "workspace-1" } }),
}));
vi.mock(
  "@/hooks/queries/workspace-users/use-get-active-workspace-users",
  () => ({
    useGetActiveWorkspaceUsers: () => ({ data: { members: [] } }),
  }),
);
vi.mock("@/hooks/mutations/task-relation/use-create-task-relation", () => ({
  default: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("@/hooks/mutations/task-relation/use-delete-task-relation", () => ({
  default: () => ({ mutate: mocks.deleteRelation }),
}));
vi.mock("@/hooks/use-workspace-permission", () => ({
  useWorkspacePermission: () => ({
    canUpdateTasks: mocks.canUpdateTasks,
  }),
}));
vi.mock("./subtask-status-popover", () => ({
  default: ({ children }: { children: unknown }) => children,
}));
vi.mock("./sections/reference-assignee-button", () => ({
  ReferenceAssigneeButton: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const relatedTask = {
  id: "blocker-1",
  title: "Write the spec",
  status: "to-do",
  isCompleted: false,
  priority: null,
  number: 12,
  projectId: "project-1",
  userId: null,
  assigneeName: null,
};

describe("TaskRelations", () => {
  it("removes a link from the row", () => {
    mocks.canUpdateTasks.mockReturnValue(true);
    mocks.getRelations.mockReturnValue({
      data: [
        {
          id: "rel-1",
          sourceTaskId: "blocker-1",
          targetTaskId: "task-1",
          relationType: "blocks",
          createdAt: "2026-11-09T00:00:00.000Z",
          sourceTask: relatedTask,
          targetTask: { ...relatedTask, id: "task-1", title: "Ship" },
        },
      ],
    });

    render(
      <TaskRelations
        taskId="task-1"
        projectId="project-1"
        workspaceId="workspace-1"
      />,
    );

    const remove = screen.getByRole("button", {
      name: "tasks:relations.removeDependency",
    });
    expect(remove).toHaveAttribute("title", "tasks:relations.removeDependency");
    fireEvent.click(remove);
    expect(mocks.deleteRelation).toHaveBeenCalledWith("rel-1");
  });
});
