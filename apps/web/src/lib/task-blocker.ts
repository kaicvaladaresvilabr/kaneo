import { HttpError } from "./http-error";
import type { TaskBlocker } from "./parse-api-error-body";

export type { TaskBlocker };

export function isTaskBlockedError(
  error: unknown,
): error is HttpError & { blockers: TaskBlocker[] } {
  if (!(error instanceof HttpError) || error.code !== "TASK_BLOCKED") {
    return false;
  }
  return Array.isArray(error.blockers) && error.blockers.length > 0;
}
