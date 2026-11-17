import type { ImportSource } from "../types.js";
import { AsanaExportError, parseAsanaExport } from "./export.js";
import { listAsanaProjects, mapAsanaProject } from "./mapping.js";

export type AsanaCredentials = { document: string };

export async function connectAsana(
  credentials: AsanaCredentials,
): Promise<ImportSource> {
  const tasks = parseAsanaExport(credentials.document);
  const projects = listAsanaProjects(tasks);

  return {
    async listProjects() {
      return projects;
    },
    async readProject(projectId) {
      if (!projects.some((project) => project.id === projectId)) {
        throw new AsanaExportError("That project is not in this export.");
      }
      return mapAsanaProject(projectId, tasks);
    },
  };
}
