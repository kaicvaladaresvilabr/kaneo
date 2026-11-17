import enUS from "@i18n/en-US.json";
import { addDays } from "date-fns";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { resolveColumnColor } from "@/lib/column-color";
import { resolveLabelColor } from "@/lib/label-color";
import type Task from "@/types/task";
import { GanttTaskBar } from "./gantt-task-bar";

const preferences = vi.hoisted(() => ({
  calendarTaskColor: "column" as "column" | "label" | "none",
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  preferences.calendarTaskColor = "column";
});

vi.mock("@/hooks/mutations/task/use-update-task", () => ({
  useUpdateTask: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/store/user-preferences", () => ({
  useUserPreferencesStore: (
    select: (state: { calendarTaskColor: string }) => unknown,
  ) => select(preferences),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const [namespace, path] = key.split(":");
      const source = path
        .split(".")
        .reduce<unknown>(
          (accumulator, part) =>
            (accumulator as Record<string, unknown> | undefined)?.[part],
          (enUS as Record<string, unknown>)[namespace],
        );

      if (typeof source !== "string") return key;

      return source.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
        String(options?.[name] ?? `{{${name}}}`),
      );
    },
  }),
}));

const rangeStart = new Date(2026, 7, 10);
const days = [0, 1, 2, 3, 4].map((offset) => addDays(rangeStart, offset));
const timeline = {
  days,
  rangeStart,
  gridTemplateColumns: `repeat(${days.length}, 2.75rem)`,
};

function makeTask(
  overrides: Partial<Task> & { columnColor?: string | null } = {},
) {
  return {
    id: "t1",
    title: "Design review",
    number: 12,
    description: null,
    status: "in-review",
    priority: null,
    startDate: "2026-08-10",
    dueDate: "2026-08-12",
    position: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId: "project-1",
    scheduleStart: new Date(2026, 7, 10),
    scheduleEnd: new Date(2026, 7, 12),
    columnColor: "yellow",
    labels: [{ id: "l1", name: "bug", color: "red" }],
    ...overrides,
  };
}

function renderBar(
  overrides: Partial<Task> & { columnColor?: string | null } = {},
) {
  return render(
    <GanttTaskBar
      task={makeTask(overrides)}
      timeline={timeline}
      pixelsPerDay={44}
      onOpenTask={vi.fn()}
    />,
  );
}

function taskBar() {
  return screen
    .getByRole("button", { name: "Design review: open or drag to move" })
    .closest("[data-calendar-task-color]");
}

describe("GanttTaskBar", () => {
  it("shows assignee initials inside the bar", () => {
    renderBar({ assigneeId: "u1", assigneeName: "Ada Lovelace" });

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("keeps the assigned circle when the profile image is still loading", () => {
    renderBar({
      assigneeId: "u1",
      assigneeName: "Ada Lovelace",
      assigneeImage: "https://example.com/ada.png",
    });

    expect(screen.queryByText("?")).not.toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("keeps an unassigned circle when nobody owns the task", () => {
    renderBar();

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("tints the bar with the workflow column color by default", () => {
    renderBar();

    const bar = taskBar();
    expect(bar).toHaveAttribute("data-calendar-task-color", "column");
    expect(
      (bar as HTMLElement).style.getPropertyValue("--calendar-task-color"),
    ).toBe(resolveColumnColor("yellow"));
  });

  it("tints the bar with the first label when that source is selected", () => {
    preferences.calendarTaskColor = "label";
    renderBar();

    const bar = taskBar();
    expect(bar).toHaveAttribute("data-calendar-task-color", "label");
    expect(
      (bar as HTMLElement).style.getPropertyValue("--calendar-task-color"),
    ).toBe(resolveLabelColor("red"));
  });

  it("keeps the primary look when color is turned off", () => {
    preferences.calendarTaskColor = "none";
    renderBar();

    const bar = taskBar();
    expect(bar).toHaveAttribute("data-calendar-task-color", "none");
    expect(
      (bar as HTMLElement).style.getPropertyValue("--calendar-task-color"),
    ).toBe("");
  });
});
