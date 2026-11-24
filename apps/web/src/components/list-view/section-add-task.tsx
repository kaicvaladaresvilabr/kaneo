import { Calendar, Plus, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { OptionMenu } from "@/components/common/option-menu/option-menu";
import TaskDueDatePicker from "@/components/task/task-due-date-picker";
import { assigneeMenuOptions } from "@/components/task/menus/assignee-menu-options";
import { AssigneeAvatar } from "@/components/task/properties/assignee-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useCreateTask from "@/hooks/mutations/task/use-create-task";
import useGetProjectMembers from "@/hooks/queries/workspace-users/use-get-project-members";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

type SectionAddTaskProps = {
  projectId: string;
  workspaceId: string;
  status: string;
  canAssign: boolean;
  composing: boolean;
  focusTick: number;
  onOpen: () => void;
  onClose: () => void;
  variant?: "list" | "board";
};

const iconButtonClass =
  "flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 text-muted-foreground outline-none transition-colors hover:bg-background/80 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-background/80 data-popup-open:text-foreground";

export function SectionAddTask({
  projectId,
  workspaceId,
  status,
  canAssign,
  composing,
  focusTick,
  onOpen,
  onClose,
  variant = "list",
}: SectionAddTaskProps) {
  const { t } = useTranslation();
  const { mutateAsync: createTask } = useCreateTask();
  const { data: members = [] } = useGetProjectMembers({
    workspaceId: composing ? workspaceId : "",
    projectId: composing ? projectId : "",
  });
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const alive = useRef(true);
  const assigneeOpenRef = useRef(false);
  const dueOpenRef = useRef(false);
  const rowClickRef = useRef(false);
  const draftRef = useRef({ title, assigneeId, dueDate });
  draftRef.current = { title, assigneeId, dueDate };

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!composing) {
      setTitle("");
      setAssigneeId("");
      setDueDate(undefined);
      setAssigneeOpen(false);
      setDueOpen(false);
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [composing, focusTick]);

  const assignee = members.find((member) => member.id === assigneeId);
  const dueLabel = dueDate
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(dueDate)
    : "";
  const dueTitle = dueDate
    ? new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(dueDate)
    : "";

  async function finish(keepOpen: boolean) {
    const draft = draftRef.current;
    const name = draft.title.trim();
    if (!name) {
      if (!keepOpen) onClose();
      return;
    }
    if (pending.current) return;
    pending.current = true;
    try {
      await createTask({
        title: name,
        description: "",
        userId: draft.assigneeId,
        priority: "no-priority",
        projectId,
        dueDate: draft.dueDate ? draft.dueDate.toISOString() : undefined,
        status,
      });
      if (!alive.current) return;
      setTitle((current) => (current.trim() === name ? "" : current));
      setAssigneeId("");
      setDueDate(undefined);
      if (keepOpen) inputRef.current?.focus();
      else onClose();
    } catch (error) {
      if (!alive.current) return;
      toast.error(
        error instanceof Error
          ? error.message
          : t("common:modals.createTask.createError"),
      );
    } finally {
      pending.current = false;
    }
  }

  function dismissIfLeft(next: EventTarget | null) {
    if (rowClickRef.current) return;
    if (next instanceof Node && rootRef.current?.contains(next)) return;
    // Assignee and date popovers render outside this row. Wait a tick so an
    // open popover is not treated as leaving the draft.
    window.setTimeout(() => {
      if (!alive.current || assigneeOpenRef.current || dueOpenRef.current) {
        return;
      }
      const active = document.activeElement;
      if (active && rootRef.current?.contains(active)) return;
      if (active?.closest("[data-slot='popover-positioner']")) return;
      void finish(false);
    }, 0);
  }

  const board = variant === "board";

  return (
    <div
      ref={rootRef}
      onBlur={(event) => dismissIfLeft(event.relatedTarget)}
      className={board ? "mt-1.5 flex flex-col gap-1.5" : undefined}
    >
      {composing && (
        <form
          className={
            board
              ? "flex h-10 items-center gap-2 rounded-[10px] border border-board-card-border bg-board-card px-3 shadow-board-card"
              : "flex h-10 items-center gap-2 bg-accent/60 pr-2 pl-3.5"
          }
          onSubmit={(event) => {
            event.preventDefault();
            void finish(true);
          }}
        >
          <input
            ref={inputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            placeholder={t("tasks:listView.taskNamePlaceholder")}
            aria-label={t("tasks:listView.taskNamePlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {canAssign && (
            <Popover
              open={assigneeOpen}
              onOpenChange={(open) => {
                assigneeOpenRef.current = open;
                setAssigneeOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={
                    assignee?.name || t("tasks:listView.assignThisTask")
                  }
                  title={assignee?.name || t("tasks:listView.assignThisTask")}
                  className={iconButtonClass}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {assignee ? (
                    <AssigneeAvatar
                      name={assignee.name}
                      image={assignee.image}
                      assigned
                      className="size-5 text-[8px]"
                    />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-0" align="end">
                <OptionMenu
                  label={t("tasks:assignee.label")}
                  placeholder={t("tasks:bulk.assigneePlaceholder")}
                  options={assigneeMenuOptions(
                    members,
                    assigneeId || null,
                    t("tasks:popover.assignee.unassigned"),
                  )}
                  onSelect={(userId) => {
                    setAssigneeId(userId);
                    setAssigneeOpen(false);
                    assigneeOpenRef.current = false;
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
          <Popover
            open={dueOpen}
            onOpenChange={(open) => {
              dueOpenRef.current = open;
              setDueOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  dueDate
                    ? t("tasks:due.fullDate", { date: dueTitle })
                    : t("tasks:listView.setDueDate")
                }
                title={dueDate ? dueTitle : t("tasks:listView.setDueDate")}
                className={cn(iconButtonClass, dueDate && "text-foreground")}
                onMouseDown={(event) => event.preventDefault()}
              >
                <Calendar className="size-3.5" />
                {dueDate && <span className="text-xs">{dueLabel}</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-65 p-0" align="end">
              <TaskDueDatePicker
                label={t("tasks:dueDate.label")}
                clearLabel={t("tasks:popover.dueDate.clear")}
                dueDate={dueDate ?? null}
                recurrence={null}
                canSetRecurrence={false}
                onDateChange={(date) => {
                  setDueDate(date ?? undefined);
                  setDueOpen(false);
                  dueOpenRef.current = false;
                }}
                onRecurrenceChange={() => undefined}
              />
            </PopoverContent>
          </Popover>
        </form>
      )}
      <button
        type="button"
        onMouseDown={() => {
          rowClickRef.current = true;
          const clear = () => {
            rowClickRef.current = false;
            window.removeEventListener("mouseup", clear);
          };
          window.addEventListener("mouseup", clear);
        }}
        onClick={() => {
          // This row stays under the draft, so leaving the field never sees
          // the click as "outside". Save the title already written, then keep
          // the field open for the next task.
          if (composing && draftRef.current.title.trim()) {
            void finish(true);
            return;
          }
          onOpen();
        }}
        className={
          board
            ? "flex h-9 w-full cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-board-card hover:text-foreground"
            : "flex h-10 w-full cursor-pointer items-center px-3.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
        }
      >
        {board && <Plus className="size-3.5 shrink-0" aria-hidden />}
        {t("tasks:listView.addTaskRow")}
      </button>
    </div>
  );
}
