import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PROJECT_ROUTE_PATHS } from "@/components/project/views/project-views";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { getStatusLabel } from "@/lib/i18n/domain";
import type { TaskBlocker } from "@/lib/task-blocker";
import { useProjectSlugs } from "./sections/use-project-slugs";
import { useTaskBlockedDialogStore } from "./task-blocked-dialog-store";

export default function TaskBlockedDialog() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: workspace } = useActiveWorkspace();
  const { workspaceId: routeWorkspaceId, projectId: currentProjectId } =
    useParams({
      strict: false,
      select: (params) => ({
        workspaceId:
          "workspaceId" in params && typeof params.workspaceId === "string"
            ? params.workspaceId
            : undefined,
        projectId:
          "projectId" in params && typeof params.projectId === "string"
            ? params.projectId
            : undefined,
      }),
    });
  const blockers = useTaskBlockedDialogStore((state) => state.blockers);
  const close = useTaskBlockedDialogStore((state) => state.close);
  const workspaceId = routeWorkspaceId ?? workspace?.id;
  const displayIdOf = useProjectSlugs(workspaceId ?? "");

  const openBlocker = (blocker: TaskBlocker) => {
    close();
    if (!workspaceId) return;
    if (currentProjectId === blocker.projectId) {
      void navigate({ to: ".", search: { taskId: blocker.id } });
      return;
    }
    void navigate({
      to: PROJECT_ROUTE_PATHS.board,
      params: { workspaceId, projectId: blocker.projectId },
      search: { taskId: blocker.id },
    });
  };

  return (
    <Dialog
      open={blockers !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("tasks:blocked.title")}</DialogTitle>
          <DialogDescription>
            {t("tasks:blocked.description")}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <ul className="flex flex-col gap-1">
            {(blockers ?? []).map((blocker) => {
              const ticket = displayIdOf(blocker.projectId, blocker.number);
              return (
                <li key={blocker.id}>
                  <button
                    type="button"
                    className="flex w-full items-baseline gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => openBlocker(blocker)}
                    aria-label={t("tasks:blocked.openTask", {
                      title: blocker.title,
                    })}
                  >
                    {ticket ? (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {ticket}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {blocker.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {getStatusLabel(blocker.status)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
