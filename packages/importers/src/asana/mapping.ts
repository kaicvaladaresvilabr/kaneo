import { toIsoDate } from "../markdown.js";
import type {
  ImportedColumn,
  ImportedPerson,
  ImportedProject,
  ImportedTask,
  SourceProject,
} from "../types.js";
import type { AsanaNamedRef, AsanaTask } from "./export.js";

export const ASANA_COMPLETED_COLUMN_KEY = "asana-completed";
export const ASANA_COMPLETED_COLUMN_NAME = "Concluído";
const UNTITLED_COLUMN_KEY = "asana-untitled";
const UNTITLED_COLUMN_NAME = "Untitled";
const UNTITLED_PROJECT = "Untitled";
const UNTITLED_TASK = "Untitled task";

type AsanaSection = { gid: string; name: string };

export function listAsanaProjects(
  tasks: readonly AsanaTask[],
): SourceProject[] {
  const projects = new Map<string, SourceProject>();

  for (const task of tasks) {
    const workspace = task.workspace?.name?.trim();
    for (const project of projectsOf(task)) {
      if (projects.has(project.gid)) continue;
      projects.set(project.gid, {
        id: project.gid,
        name: project.name?.trim() || UNTITLED_PROJECT,
        ...(workspace ? { detail: workspace } : {}),
      });
    }
  }

  return [...projects.values()];
}

export function mapAsanaProject(
  projectId: string,
  tasks: readonly AsanaTask[],
): ImportedProject {
  const inProject = tasks.filter((task) =>
    projectsOf(task).some((project) => project.gid === projectId),
  );
  const project = inProject
    .flatMap((task) => projectsOf(task))
    .find((candidate) => candidate.gid === projectId);
  const columns = planColumns(inProject, projectId);

  return {
    name: project?.name?.trim() || UNTITLED_PROJECT,
    columns,
    labels: [],
    tasks: inProject.map((task) => mapTask(task, projectId)),
    relations: [],
    warnings: [],
  };
}

function planColumns(
  tasks: readonly AsanaTask[],
  projectId: string,
): ImportedColumn[] {
  const columns: ImportedColumn[] = [];
  const seen = new Set<string>();
  let hasCompleted = false;

  for (const task of tasks) {
    if (task.completed) {
      hasCompleted = true;
      continue;
    }
    const section = sectionFor(task, projectId) ?? {
      gid: UNTITLED_COLUMN_KEY,
      name: UNTITLED_COLUMN_NAME,
    };
    if (seen.has(section.gid)) continue;
    seen.add(section.gid);
    columns.push({ key: section.gid, name: section.name, isFinal: false });
  }

  if (hasCompleted) {
    columns.push({
      key: ASANA_COMPLETED_COLUMN_KEY,
      name: ASANA_COMPLETED_COLUMN_NAME,
      isFinal: true,
    });
  }

  return columns;
}

function mapTask(task: AsanaTask, projectId: string): ImportedTask {
  const completed = Boolean(task.completed);
  const section = sectionFor(task, projectId);
  const startDate = asanaDate(task.start_on, task.start_at);
  const dueDate = asanaDate(task.due_on, task.due_at);
  const createdAt = toIsoDate(task.created_at);
  const assignee = mapAssignee(task);

  return {
    key: task.gid,
    columnKey: completed
      ? ASANA_COMPLETED_COLUMN_KEY
      : (section?.gid ?? UNTITLED_COLUMN_KEY),
    title: task.name?.trim() || UNTITLED_TASK,
    description: description(task, section, completed),
    priority: "no-priority",
    ...(startDate ? { startDate } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(assignee ? { assignee } : {}),
    labelKeys: [],
    comments: [],
  };
}

function description(
  task: AsanaTask,
  section: AsanaSection | null,
  completed: boolean,
): string {
  const notes = task.notes?.trim() ?? "";
  if (!completed || !section) return notes;
  const origin = `Seção no Asana: ${section.name}`;
  return notes ? `${notes}\n\n${origin}` : origin;
}

function mapAssignee(task: AsanaTask): ImportedPerson | undefined {
  const name = task.assignee?.name?.trim();
  if (!name) return undefined;
  return name.includes("@") ? { email: name } : { name };
}

function asanaDate(
  day: string | null | undefined,
  instant: string | null | undefined,
): string | undefined {
  return toIsoDate(instant) ?? toIsoDate(day);
}

function sectionFor(task: AsanaTask, projectId: string): AsanaSection | null {
  const membership = task.memberships?.find(
    (entry) => entry.project?.gid === projectId,
  );
  const section = membership?.section;
  const gid = section?.gid?.trim();
  if (!gid) return null;
  return { gid, name: section?.name?.trim() || UNTITLED_COLUMN_NAME };
}

function projectsOf(task: AsanaTask): AsanaNamedRef[] {
  const projects = new Map<string, AsanaNamedRef>();
  for (const membership of task.memberships ?? []) {
    rememberProject(projects, membership.project);
  }
  for (const project of task.projects ?? []) {
    rememberProject(projects, project);
  }
  return [...projects.values()];
}

function rememberProject(
  projects: Map<string, AsanaNamedRef>,
  project: AsanaNamedRef | null | undefined,
) {
  const gid = project?.gid?.trim();
  if (!gid || projects.has(gid)) return;
  projects.set(gid, { gid, name: project?.name });
}
