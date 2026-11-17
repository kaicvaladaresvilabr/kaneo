import { useNavigate } from "@tanstack/react-router";
import { Ban } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/preview-card";
import { cn } from "@/lib/cn";
import type Task from "@/types/task";
import { BlockersHoverList } from "./blockers-hover-list";
import { stopCardEvents } from "./stop-card-events";
import { taskChipClass } from "./task-chip-class";

type BlockedChipProps = {
  task: Task;
  workspaceId: string;
  className?: string;
};

export function BlockedChip({
  task,
  workspaceId,
  className,
}: BlockedChipProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const counts = task.blockerCounts;
  const openCount = (counts?.total ?? 0) - (counts?.completed ?? 0);
  if (!openCount) return null;

  const openTask = (blocker: Pick<Task, "id" | "projectId">) => {
    setOpen(false);
    if (blocker.projectId === task.projectId) {
      navigate({ to: ".", search: { taskId: blocker.id } });
      return;
    }
    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
      params: {
        workspaceId,
        projectId: blocker.projectId,
        taskId: blocker.id,
      },
    });
  };

  const label = t("tasks:blocked.openCount", { count: openCount });

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
            "text-destructive-foreground hover:text-destructive-foreground",
          )}
          {...stopCardEvents}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
        >
          <Ban aria-hidden="true" />
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
          <BlockersHoverList
            taskId={task.id}
            workspaceId={workspaceId}
            onOpenTask={openTask}
          />
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
