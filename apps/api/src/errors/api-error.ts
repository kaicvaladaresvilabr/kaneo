import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ApiErrorIssue = { path: string; message: string };

export type TaskBlocker = {
  id: string;
  title: string;
  number: number | null;
  projectId: string;
  status: string;
};

export type ApiErrorBody = {
  message: string;
  code: string;
  issues?: ApiErrorIssue[];
  missingPermissions?: string[];
  blockers?: TaskBlocker[];
};

export class ApiError extends HTTPException {
  readonly code: string;
  readonly issues?: ApiErrorIssue[];
  readonly missingPermissions?: string[];
  readonly blockers?: TaskBlocker[];

  constructor(status: ContentfulStatusCode, body: ApiErrorBody) {
    super(status, { message: body.message });
    this.code = body.code;
    this.issues = body.issues;
    this.missingPermissions = body.missingPermissions;
    this.blockers = body.blockers;
  }
}
