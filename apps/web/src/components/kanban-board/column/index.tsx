import { useDroppable } from "@dnd-kit/core";
import { cva } from "class-variance-authority";
import { memo, useState } from "react";
import { SectionAddTask } from "@/components/list-view/section-add-task";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { useBackgroundStore } from "@/store/background";
import type { ProjectWithTasks } from "@/types/project";
import ColumnDropzone from "./column-dropzone";
import { ColumnHeader } from "./column-header";
import { ColumnSortHint } from "./column-sort-hint";

type ColumnProps = {
  column: ProjectWithTasks["columns"][number];
  projectId: string;
  workspaceId: string;
  activeTaskId: string | null;
  sortHint?: string;
  disableDragDrop?: boolean;
  disableSorting?: boolean;
  disableCollectionActions?: boolean;
  animateEntries?: boolean;
};

export const columnVariants = cva(
  "group relative flex h-full min-h-0 w-full flex-col rounded-xl transition-colors duration-150",
  {
    defaultVariants: {
      isDropzoneOver: false,
      backgroundImage: false,
    },
    variants: {
      isDropzoneOver: {
        true: "",
        false: "",
      },
      backgroundImage: {
        true: "before:content-[''] before:absolute before:inset-0 before:rounded-[calc(var(--radius-xl)-1px)] before:pointer-events-none",
        false: "",
      },
    },
    compoundVariants: [
      {
        isDropzoneOver: false,
        backgroundImage: false,
        class: "bg-board-lane",
      },
      {
        isDropzoneOver: true,
        backgroundImage: false,
        class: "bg-board-lane ring-2 ring-board-card-ring",
      },
      {
        isDropzoneOver: false,
        backgroundImage: true,
        class:
          "border border-border/70 bg-background shadow-md before:bg-muted before:dark:bg-card",
      },
      {
        isDropzoneOver: true,
        backgroundImage: true,
        class:
          "border border-border/70 bg-background ring-2 ring-focus/60 before:bg-accent/60",
      },
    ],
  },
);

function Column({
  column,
  projectId,
  workspaceId,
  activeTaskId,
  sortHint,
  disableDragDrop = false,
  disableSorting = false,
  disableCollectionActions = false,
  animateEntries = true,
}: ColumnProps) {
  const { canCreateTasks, canAssignTasks } = useWorkspacePermission();
  const [composing, setComposing] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });
  const { background } = useBackgroundStore();
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <div
      ref={setNodeRef}
      className={columnVariants({
        isDropzoneOver: isOver,
        backgroundImage: !!background,
      })}
    >
      <div className="shrink-0 pt-1 pr-2 pl-3">
        <ColumnHeader
          column={column}
          disableCollectionActions={disableCollectionActions}
        />
      </div>
      <div
        ref={setScrollElement}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 pt-1.5 pb-1.5 [-webkit-overflow-scrolling:touch]"
      >
        <ColumnDropzone
          scrollElement={scrollElement}
          column={column}
          activeTaskId={activeTaskId}
          disableDragDrop={disableDragDrop}
          disableSorting={disableSorting}
          animateEntries={animateEntries}
        />
        {canCreateTasks() && (
          <SectionAddTask
            projectId={projectId}
            workspaceId={workspaceId}
            status={column.slug}
            canAssign={canAssignTasks()}
            composing={composing}
            focusTick={focusTick}
            variant="board"
            onOpen={() => {
              setComposing(true);
              setFocusTick((tick) => tick + 1);
            }}
            onClose={() => setComposing(false)}
          />
        )}
      </div>
      {sortHint && <ColumnSortHint label={sortHint} />}
    </div>
  );
}

export default memo(Column);
