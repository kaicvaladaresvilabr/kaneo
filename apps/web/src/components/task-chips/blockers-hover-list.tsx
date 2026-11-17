import { useTranslation } from "react-i18next";
import { AssigneeAvatar } from "@/components/task/properties/assignee-avatar";
import { useProjectSlugs } from "@/components/task/sections/use-project-slugs";
import useGetTaskRelations from "@/hooks/queries/task-relation/use-get-task-relations";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { getColumnIcon } from "@/lib/column";
import type Task from "@/types/task";

type BlockersHoverListProps = {
  taskId: string;
  workspaceId: string;
  onOpenTask: (task: Pick<Task, "id" | "projectId">) => void;
};

export function BlockersHoverList({
  taskId,
  workspaceId,
  onOpenTask,
}: BlockersHoverListProps) {
  const { t } = useTranslation();
  const { data: relations = [], isLoading } = useGetTaskRelations(taskId);
  const displayIdOf = useProjectSlugs(workspaceId);
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(workspaceId);

  const blockers = relations.flatMap((relation) =>
    relation.relationType === "blocks" &&
    relation.targetTaskId === taskId &&
    relation.sourceTask &&
    !relation.sourceTask.isCompleted
      ? [relation.sourceTask]
      : [],
  );

  return (
    <div className="flex w-72 max-w-[calc(100vw-2rem)] flex-col">
      <div className="flex h-9 items-center gap-2 border-border border-b px-3">
        <span className="font-medium text-[13px] text-foreground">
          {t("tasks:relations.blockedBy")}
        </span>
        <span className="truncate text-muted-foreground text-xs">
          {t("tasks:blocked.openCount", { count: blockers.length })}
        </span>
      </div>
      <div className="flex flex-col p-1">
        {isLoading ? (
          <p className="px-2 py-2 text-muted-foreground text-xs">
            {t("common:empty.loading")}
          </p>
        ) : (
          blockers.map((blocker) => (
            <button
              key={blocker.id}
              type="button"
              onClick={() => onOpenTask(blocker)}
              className="flex h-8.5 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
            >
              <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
                {getColumnIcon(blocker.status, blocker.isCompleted)}
              </span>
              <span className="w-13 shrink-0 truncate font-mono text-[11px] text-muted-foreground">
                {displayIdOf(blocker.projectId, blocker.number)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {blocker.title}
              </span>
              <AssigneeAvatar
                name={blocker.assigneeName}
                image={
                  workspaceUsers?.members?.find(
                    (member) => member.userId === blocker.userId,
                  )?.user?.image
                }
                assigned={Boolean(blocker.userId)}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
