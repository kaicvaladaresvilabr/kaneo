import { expect } from "vite-plus/test";

export type ApiErrorBody = {
  message: string;
  code: string;
  issues?: Array<{ path: string; message: string }>;
  missingPermissions?: string[];
  blockers?: Array<{
    id: string;
    title: string;
    number: number | null;
    projectId: string;
    status: string;
  }>;
};

export async function readErrorBody(response: Response) {
  expect(response.headers.get("content-type")).toContain("application/json");
  return (await response.json()) as ApiErrorBody;
}
