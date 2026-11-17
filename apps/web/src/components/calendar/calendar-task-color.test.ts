import { describe, expect, it } from "vite-plus/test";
import { resolveColumnColor } from "@/lib/column-color";
import { resolveLabelColor } from "@/lib/label-color";
import {
  attachCalendarColumnColors,
  calendarTaskTone,
  resolveCalendarTaskColor,
} from "./calendar-task-color";

describe("attachCalendarColumnColors", () => {
  it("copies the matching column color onto each task", () => {
    const [todo, done] = attachCalendarColumnColors(
      [{ status: "to-do" }, { status: "done" }],
      [
        { id: "to-do", slug: "to-do", color: "blue" },
        { id: "done", slug: "done", color: "green" },
      ],
    );

    expect(todo.columnColor).toBe("blue");
    expect(done.columnColor).toBe("green");
  });

  it("leaves planned tasks without a column color", () => {
    const [planned] = attachCalendarColumnColors(
      [{ status: "planned" }],
      [{ id: "to-do", slug: "to-do", color: "blue" }],
    );

    expect(planned.columnColor).toBeNull();
  });
});

describe("resolveCalendarTaskColor", () => {
  const labels = [{ color: "red" }, { color: "green" }];

  it("uses the workflow column color by default, including the blue fallback", () => {
    expect(
      resolveCalendarTaskColor({
        source: "column",
        columnColor: "green",
        labels,
      }),
    ).toBe(resolveColumnColor("green"));
    expect(
      resolveCalendarTaskColor({
        source: "column",
        columnColor: null,
        labels,
      }),
    ).toBe(resolveColumnColor(null));
  });

  it("uses the first label color and falls back to none when unlabeled", () => {
    expect(
      resolveCalendarTaskColor({
        source: "label",
        columnColor: "blue",
        labels,
      }),
    ).toBe(resolveLabelColor("red"));
    expect(
      resolveCalendarTaskColor({
        source: "label",
        columnColor: "blue",
        labels: [],
      }),
    ).toBeNull();
  });

  it("returns no tint when color is turned off", () => {
    expect(
      resolveCalendarTaskColor({
        source: "none",
        columnColor: "blue",
        labels,
      }),
    ).toBeNull();
  });
});

describe("calendarTaskTone", () => {
  it("sets a CSS variable when a color is present", () => {
    expect(calendarTaskTone("var(--color-blue-600)").style).toEqual({
      "--calendar-task-color": "var(--color-blue-600)",
    });
    expect(calendarTaskTone(null).style).toBeUndefined();
  });
});
