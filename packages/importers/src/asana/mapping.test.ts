import { describe, expect, it } from "vite-plus/test";
import { AsanaExportError, parseAsanaExport } from "./export.js";
import {
  ASANA_COMPLETED_COLUMN_KEY,
  ASANA_COMPLETED_COLUMN_NAME,
  listAsanaProjects,
  mapAsanaProject,
} from "./mapping.js";
import { connectAsana } from "./source.js";

const EXPORT = {
  data: [
    {
      gid: "done-1",
      resource_type: "task",
      name: "Fechar aditivo",
      notes: "Aditivo do muro",
      completed: true,
      due_on: "2026-11-10",
      created_at: "2026-11-09T19:48:54.784Z",
      assignee: { gid: "user-1", name: "Lorran Freitas Gonçalves" },
      memberships: [
        {
          project: { gid: "project-1", name: "Porto Quaresmeiras" },
          section: { gid: "section-plan", name: "Planejamento" },
        },
      ],
      projects: [{ gid: "project-1", name: "Porto Quaresmeiras" }],
      workspace: { gid: "workspace-1", name: "Meu espaço de trabalho" },
    },
    {
      gid: "open-1",
      resource_type: "task",
      name: "Reforço do radier",
      notes: "",
      completed: false,
      due_at: "2026-11-04T15:00:00.000Z",
      assignee: { gid: "user-2", name: "igor@example.com" },
      memberships: [
        {
          project: { gid: "project-1", name: "Porto Quaresmeiras" },
          section: { gid: "section-obra", name: "Obra" },
        },
      ],
      projects: [{ gid: "project-1", name: "Porto Quaresmeiras" }],
      subtasks: [],
      tags: [],
      custom_fields: [],
    },
  ],
};

describe("parseAsanaExport", () => {
  it("rejects a file that is not an Asana task export", () => {
    expect(() => parseAsanaExport("{")).toThrow(AsanaExportError);
    expect(() => parseAsanaExport(JSON.stringify({ tasks: [] }))).toThrow(
      AsanaExportError,
    );
    expect(() =>
      parseAsanaExport(JSON.stringify({ data: [{ gid: "no-type" }] })),
    ).toThrow(AsanaExportError);
  });
});

describe("mapAsanaProject", () => {
  const tasks = parseAsanaExport(JSON.stringify(EXPORT));

  it("lists each Asana project once", () => {
    expect(listAsanaProjects(tasks)).toEqual([
      {
        id: "project-1",
        name: "Porto Quaresmeiras",
        detail: "Meu espaço de trabalho",
      },
    ]);
  });

  it("keeps an open task in its section and moves a completed task to a final column", () => {
    const project = mapAsanaProject("project-1", tasks);

    expect(project.name).toBe("Porto Quaresmeiras");
    expect(project.columns).toEqual([
      { key: "section-obra", name: "Obra", isFinal: false },
      {
        key: ASANA_COMPLETED_COLUMN_KEY,
        name: ASANA_COMPLETED_COLUMN_NAME,
        isFinal: true,
      },
    ]);
    expect(project.tasks).toEqual([
      expect.objectContaining({
        key: "done-1",
        columnKey: ASANA_COMPLETED_COLUMN_KEY,
        title: "Fechar aditivo",
        description: "Aditivo do muro\n\nSeção no Asana: Planejamento",
        assignee: { name: "Lorran Freitas Gonçalves" },
        dueDate: "2026-11-10T00:00:00.000Z",
        priority: "no-priority",
      }),
      expect.objectContaining({
        key: "open-1",
        columnKey: "section-obra",
        title: "Reforço do radier",
        description: "",
        assignee: { email: "igor@example.com" },
        dueDate: "2026-11-04T15:00:00.000Z",
      }),
    ]);
    expect(project.labels).toEqual([]);
    expect(project.relations).toEqual([]);
  });
});

describe("connectAsana", () => {
  it("refuses a project that is not in the export", async () => {
    const source = await connectAsana({
      document: JSON.stringify(EXPORT),
    });

    await expect(
      source.readProject("missing", { includeComments: false }),
    ).rejects.toThrow("That project is not in this export.");
  });
});
