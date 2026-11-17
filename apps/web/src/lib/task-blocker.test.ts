import { describe, expect, it } from "vite-plus/test";
import { HttpError } from "./http-error";
import { isTaskBlockedError } from "./task-blocker";

const blockers = [
  {
    id: "blocker-1",
    title: "Write the spec",
    number: 12,
    projectId: "project-1",
    status: "to-do",
  },
];

describe("isTaskBlockedError", () => {
  it("accepts a TASK_BLOCKED HttpError with blockers", () => {
    const error = new HttpError(
      409,
      "This task is blocked by unfinished work",
      {
        code: "TASK_BLOCKED",
        blockers,
      },
    );
    expect(isTaskBlockedError(error)).toBe(true);
    if (isTaskBlockedError(error)) {
      expect(error.blockers).toEqual(blockers);
    }
  });

  it("rejects other errors", () => {
    expect(isTaskBlockedError(new Error("nope"))).toBe(false);
    expect(
      isTaskBlockedError(
        new HttpError(409, "Board changed", { code: "CONFLICT" }),
      ),
    ).toBe(false);
    expect(
      isTaskBlockedError(
        new HttpError(409, "This task is blocked by unfinished work", {
          code: "TASK_BLOCKED",
          blockers: [],
        }),
      ),
    ).toBe(false);
  });
});
