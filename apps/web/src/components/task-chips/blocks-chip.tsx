import { useNavigate } from "@tanstack/react-router";
import { OctagonAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/preview-card";
import { cn } from "@/lib/cn";
import type Task from "@/types/task";
import { BlocksHoverList } from "./blocks-hover-list";
import { stopCardEvents } from "./stop-card-events";
import { taskChipClass } from "./task-chip-class";

type BlocksChipProps = {
  task: Task;
  workspaceId: string;
  className?: string;
};

export function BlocksChip({ task, workspaceId, className }: BlocksChipProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const counts = task.blockingCounts;
  const openCount = (counts?.total ?? 0) - (counts?.completed ?? 0);
  if (!openCount) return null;

  const openTask = (blocked: Pick<Task, "id" | "projectId">) => {
    setOpen(false);
    if (blocked.projectId === task.projectId) {
      navigate({ to: ".", search: { taskId: blocked.id } });
      return;
    }
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
      params: {
        workspaceId,
        projectId: blocked.projectId,
        taskId: blocked.id,
      },
    });
  };

  const label = t("tasks:blocked.blocksCount", { count: openCount });

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={200}
      closeDelay={100}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            taskChipClass,
            "tabular-nums",
            className,
            "text-warning-foreground hover:text-warning-foreground",
          )}
          {...stopCardEvents}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
        >
          <OctagonAlert aria-hidden="true" />
          {openCount}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="w-auto p-0"
        {...stopCardEvents}
      >
        {open && (
          <BlocksHoverList
            taskId={task.id}
            workspaceId={workspaceId}
            onOpenTask={openTask}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
