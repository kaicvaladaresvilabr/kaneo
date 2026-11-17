import { useTranslation } from "react-i18next";
import { AssigneeAvatar } from "@/components/task/properties/assignee-avatar";
import { useProjectSlugs } from "@/components/task/sections/use-project-slugs";
import useGetTaskRelations from "@/hooks/queries/task-relation/use-get-task-relations";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { getColumnIcon } from "@/lib/column";
import type Task from "@/types/task";

type BlocksHoverListProps = {
  taskId: string;
  workspaceId: string;
  onOpenTask: (task: Pick<Task, "id" | "projectId">) => void;
};

export function BlocksHoverList({
  taskId,
  workspaceId,
  onOpenTask,
}: BlocksHoverListProps) {
  const { t } = useTranslation();
  const { data: relations = [], isLoading } = useGetTaskRelations(taskId);
  const displayIdOf = useProjectSlugs(workspaceId);
  const { data: workspaceUsers } = useGetActiveWorkspaceUsers(workspaceId);

  const blocked = relations.flatMap((relation) =>
    relation.relationType === "blocks" &&
    relation.sourceTaskId === taskId &&
    relation.targetTask &&
    !relation.targetTask.isCompleted
      ? [relation.targetTask]
      : [],
  );

  return (
    <div className="flex w-72 max-w-[calc(100vw-2rem)] flex-col">
      <div className="flex h-9 items-center gap-2 border-border border-b px-3">
        <span className="font-medium text-[13px] text-foreground">
          {t("tasks:relations.blocks")}
        </span>
        <span className="truncate text-muted-foreground text-xs">
          {t("tasks:blocked.blocksCount", { count: blocked.length })}
        </span>
      </div>
      <div className="flex flex-col p-1">
        {isLoading ? (
          <p className="px-2 py-2 text-muted-foreground text-xs">
            {t("common:empty.loading")}
          </p>
        ) : (
          blocked.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task)}
              className="flex h-8.5 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
            >
              <span className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
                {getColumnIcon(task.status, task.isCompleted)}
              </span>
              <span className="w-13 shrink-0 truncate font-mono text-[11px] text-muted-foreground">
                {displayIdOf(task.projectId, task.number)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                {task.title}
              </span>
              <AssigneeAvatar
                name={task.assigneeName}
                image={
                  workspaceUsers?.members?.find(
                    (member) => member.userId === task.userId,
                  )?.user?.image
                }
                assigned={Boolean(task.userId)}
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
