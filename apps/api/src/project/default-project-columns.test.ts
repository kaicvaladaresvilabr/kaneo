import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_PROJECT_COLUMNS,
  defaultProjectColumns,
} from "./default-project-columns";

describe("defaultProjectColumns", () => {
  it("keeps the English names for any language other than Portuguese", () => {
    expect(defaultProjectColumns(null)).toBe(DEFAULT_PROJECT_COLUMNS);
    expect(defaultProjectColumns("en-US").map((column) => column.name)).toEqual(
      ["To Do", "In Progress", "In Review", "Done"],
    );
    expect(defaultProjectColumns("de-DE").map((column) => column.name)).toEqual(
      ["To Do", "In Progress", "In Review", "Done"],
    );
  });

  it("names a new pt-BR workflow in Portuguese and keeps the column keys", () => {
    const columns = defaultProjectColumns("pt-BR");

    expect(columns.map((column) => column.name)).toEqual([
      "A Fazer",
      "Em Andamento",
      "Em Revisão",
      "Concluído",
    ]);
    expect(columns.map((column) => column.slug)).toEqual([
      "to-do",
      "in-progress",
      "in-review",
      "done",
    ]);
    expect(columns[3]?.isFinal).toBe(true);
  });

  it("accepts a Portuguese language tag that is not written as pt-BR", () => {
    expect(defaultProjectColumns("pt_BR").map((column) => column.name)).toEqual(
      ["A Fazer", "Em Andamento", "Em Revisão", "Concluído"],
    );
    expect(defaultProjectColumns("pt").map((column) => column.name)[0]).toBe(
      "A Fazer",
    );
  });
});
