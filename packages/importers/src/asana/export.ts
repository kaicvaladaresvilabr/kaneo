export const ASANA_EXPORT_MAX_CHARS = 8_000_000;

export const ASANA_EXPORT_ERROR = "This file is not an Asana task export.";

export class AsanaExportError extends Error {
  constructor(message = ASANA_EXPORT_ERROR) {
    super(message);
    this.name = "AsanaExportError";
  }
}

export type AsanaNamedRef = {
  gid: string;
  name?: string | null;
};

export type AsanaTask = {
  gid: string;
  name?: string | null;
  notes?: string | null;
  completed?: boolean | null;
  created_at?: string | null;
  due_on?: string | null;
  due_at?: string | null;
  start_on?: string | null;
  start_at?: string | null;
  assignee?: { gid?: string | null; name?: string | null } | null;
  memberships?: Array<{
    project?: AsanaNamedRef | null;
    section?: AsanaNamedRef | null;
  }> | null;
  projects?: AsanaNamedRef[] | null;
  workspace?: AsanaNamedRef | null;
};

export function parseAsanaExport(document: string): AsanaTask[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(document);
  } catch {
    throw new AsanaExportError();
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.data)) {
    throw new AsanaExportError();
  }

  const tasks = parsed.data.filter(isAsanaTask);
  if (tasks.length === 0 && parsed.data.length > 0) {
    throw new AsanaExportError();
  }
  return tasks;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAsanaTask(value: unknown): value is AsanaTask {
  return (
    isRecord(value) &&
    value.resource_type === "task" &&
    typeof value.gid === "string" &&
    value.gid.trim().length > 0
  );
}
