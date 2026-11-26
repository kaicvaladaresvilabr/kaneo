import { describe, expect, it } from "vite-plus/test";
import { teamsCardCopy } from "./card-copy";

describe("teamsCardCopy", () => {
  it("writes the channel card in Portuguese for a pt-BR locale", () => {
    const copy = teamsCardCopy("pt-BR");

    expect(copy.taskCreatedTitle).toBe("Nova tarefa criada");
    expect(copy.taskCreatedBody("Ajustemas comissao monica")).toBe(
      "Uma nova tarefa foi adicionada: Ajustemas comissao monica",
    );
    expect(copy.labels).toMatchObject({
      task: "Tarefa",
      project: "Projeto",
      status: "Status",
      priority: "Prioridade",
      by: "Por",
      openTask: "Abrir tarefa",
    });
    expect(copy.status("to-do", "To Do")).toBe("A Fazer");
    expect(copy.status("to-do", "Para Fazer")).toBe("Para Fazer");
    expect(copy.priority("no-priority")).toBe("Sem prioridade");
    expect(copy.leadTime(60)).toBe("1 hora");
  });

  it("keeps English when the person has no locale", () => {
    const copy = teamsCardCopy(null);

    expect(copy.taskCreatedTitle).toBe("New task created");
    expect(copy.status("to-do", null)).toBe("To Do");
    expect(copy.priority("no-priority")).toBe("No priority");
  });
});
