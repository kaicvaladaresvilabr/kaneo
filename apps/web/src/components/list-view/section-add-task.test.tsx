import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { SectionAddTask } from "./section-add-task";

const m = vi.hoisted(() => ({
  createTask: vi.fn(async () => ({ id: "task-1" })),
}));

vi.mock("@/hooks/mutations/task/use-create-task", () => ({
  default: () => ({ mutateAsync: m.createTask }),
}));
vi.mock("@/hooks/queries/workspace-users/use-get-project-members", () => ({
  default: () => ({ data: [] }),
}));
vi.mock("@/lib/toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function Harness({
  canAssign = true,
  status = "planejamento",
  variant = "list",
}: {
  canAssign?: boolean;
  status?: string;
  variant?: "list" | "board";
}) {
  const [composing, setComposing] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  return (
    <SectionAddTask
      projectId="project-1"
      workspaceId="workspace-1"
      status={status}
      canAssign={canAssign}
      composing={composing}
      focusTick={focusTick}
      variant={variant}
      onOpen={() => {
        setComposing(true);
        setFocusTick((tick) => tick + 1);
      }}
      onClose={() => setComposing(false)}
    />
  );
}

afterEach(() => {
  cleanup();
  m.createTask.mockClear();
});

it("opens the same draft from the board row under the cards", async () => {
  render(<Harness variant="board" status="to-do" />);

  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));
  const name = screen.getByRole("textbox", { name: "Write a task name" });
  fireEvent.change(name, { target: { value: "Cobrar uso" } });
  fireEvent.submit(name.closest("form") as HTMLFormElement);

  await waitFor(() => expect(name).toHaveValue(""));
  expect(m.createTask).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Cobrar uso", status: "to-do" }),
  );
});

it("opens a name field from the row and keeps the row underneath", () => {
  render(<Harness />);

  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));

  expect(
    screen.getByRole("textbox", { name: "Write a task name" }),
  ).toHaveFocus();
  expect(
    screen.getByRole("button", { name: "Add a task" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Assign this task" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Set a due date" }),
  ).toBeInTheDocument();
});

it("creates the task in this section and stays ready for the next name", async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));
  const name = screen.getByRole("textbox", { name: "Write a task name" });
  fireEvent.change(name, { target: { value: "  Cura radier  " } });
  fireEvent.submit(name.closest("form") as HTMLFormElement);

  await waitFor(() => expect(name).toHaveValue(""));
  expect(m.createTask).toHaveBeenCalledWith({
    title: "Cura radier",
    description: "",
    userId: "",
    priority: "no-priority",
    projectId: "project-1",
    dueDate: undefined,
    status: "planejamento",
  });
  expect(name).toHaveFocus();
  expect(
    screen.getByRole("button", { name: "Add a task" }),
  ).toBeInTheDocument();
});

it("saves the open draft when the add row is clicked again", async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));
  const name = screen.getByRole("textbox", { name: "Write a task name" });
  fireEvent.change(name, { target: { value: "Fechar orçamento" } });
  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));

  await waitFor(() => expect(name).toHaveValue(""));
  expect(m.createTask).toHaveBeenCalledTimes(1);
  expect(m.createTask).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Fechar orçamento" }),
  );
  expect(name).toHaveFocus();
});

it("discards an empty draft on escape and ignores an empty submit", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Add a task" }));
  const name = screen.getByRole("textbox", { name: "Write a task name" });
  fireEvent.submit(name.closest("form") as HTMLFormElement);
  expect(m.createTask).not.toHaveBeenCalled();
  expect(name).toBeInTheDocument();

  fireEvent.keyDown(name, { key: "Escape" });
  expect(
    screen.queryByRole("textbox", { name: "Write a task name" }),
  ).toBeNull();
});
