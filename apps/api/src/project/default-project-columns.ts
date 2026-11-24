import { resolveSupportedLocale } from "../utils/supported-locales";

export const DEFAULT_PROJECT_COLUMNS = [
  {
    name: "To Do",
    slug: "to-do",
    position: 0,
    isFinal: false,
    color: "blue",
  },
  {
    name: "In Progress",
    slug: "in-progress",
    position: 1,
    isFinal: false,
    color: "blue",
  },
  {
    name: "In Review",
    slug: "in-review",
    position: 2,
    isFinal: false,
    color: "blue",
  },
  {
    name: "Done",
    slug: "done",
    position: 3,
    isFinal: true,
    color: "blue",
  },
] as const;

const PT_BR_COLUMN_NAMES = {
  "to-do": "A Fazer",
  "in-progress": "Em Andamento",
  "in-review": "Em Revisão",
  done: "Concluído",
} as const;

export function defaultProjectColumns(locale?: string | null) {
  if (resolveSupportedLocale(locale) !== "pt-BR") {
    return DEFAULT_PROJECT_COLUMNS;
  }

  return DEFAULT_PROJECT_COLUMNS.map((column) => ({
    ...column,
    name: PT_BR_COLUMN_NAMES[column.slug],
  }));
}
