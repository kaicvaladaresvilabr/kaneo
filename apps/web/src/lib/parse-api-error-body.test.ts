import { describe, expect, it } from "vite-plus/test";
import { parseApiErrorBody } from "./parse-api-error-body";

describe("parseApiErrorBody", () => {
  it("reads the standard error shape", () => {
    expect(
      parseApiErrorBody(
        JSON.stringify({
          message: "title: Required",
          code: "VALIDATION_ERROR",
          issues: [{ path: "body.title", message: "Required" }],
          missingPermissions: ["task:update"],
          blockers: [
            {
              id: "blocker-1",
              title: "Write the spec",
              number: 12,
              projectId: "project-1",
              status: "to-do",
            },
          ],
        }),
      ),
    ).toEqual({
      message: "title: Required",
      code: "VALIDATION_ERROR",
      issues: [{ path: "body.title", message: "Required" }],
      missingPermissions: ["task:update"],
      blockers: [
        {
          id: "blocker-1",
          title: "Write the spec",
          number: 12,
          projectId: "project-1",
          status: "to-do",
        },
      ],
    });
  });

  it("drops malformed optional fields", () => {
    expect(
      parseApiErrorBody(
        JSON.stringify({
          message: "Nope",
          code: 3,
          issues: [{ path: 1 }],
          missingPermissions: [true],
          blockers: [{ id: 1 }],
        }),
      ),
    ).toEqual({ message: "Nope" });
  });

  it("accepts an older error-only body", () => {
    expect(
      parseApiErrorBody(JSON.stringify({ error: "Integration not found" })),
    ).toEqual({ message: "Integration not found" });
  });

  it.each(["", "Task not found", "[]", "null", '{"ok":true}'])(
    "returns null for %j",
    (text) => {
      expect(parseApiErrorBody(text)).toBeNull();
    },
  );
});
