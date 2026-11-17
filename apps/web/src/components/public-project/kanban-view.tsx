import { getColumnIcon } from "@/lib/column";
import { resolveColumnColor } from "@/lib/column-color";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import { PublicTaskCard } from "./task-card";

type PublicKanbanViewProps = {
  project: ProjectWithTasks;
  onTaskClick: (task: Task) => void;
};

export function PublicKanbanView({
  project,
  onTaskClick,
}: PublicKanbanViewProps) {
  const columns = project.columns ?? [];

  return (
    <div className="flex-1 min-h-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
      <div className="flex gap-3 p-3 h-full min-w-max">
        {columns.map((column) => {
          return (
            <div
              key={column.id}
              className="h-full flex-1 min-w-80 max-w-96 flex-shrink-0"
            >
              <div className="flex flex-col h-full w-full min-h-0 backdrop-blur-xs rounded-lg bg-sidebar border border-border/50">
                <div className="p-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-1 shrink-0 rounded-full"
                        style={{
                          backgroundColor: resolveColumnColor(column.color),
                        }}
                      />
                      {getColumnIcon(
                        column.id,
                        column.isFinal,
                        column.icon,
                        column.color,
                      )}
                      <h3 className="font-medium text-foreground">
                        {column.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {column.tasks.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 overflow-y-auto overflow-x-hidden flex-1 min-h-0 [-webkit-overflow-scrolling:touch]">
                  <div className="flex flex-col gap-1.5">
                    {column.tasks.map((task) => (
                      <PublicTaskCard
                        key={task.id}
                        task={task}
                        projectSlug={project.slug}
                        isCompleted={column.isFinal}
                        onTaskClick={onTaskClick}
                      />
                    ))}
                  </div>

                  {column.tasks.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-12 px-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        {getColumnIcon(
                          column.id,
                          column.isFinal,
                          column.icon,
                          column.color,
                        )}
                      </div>
                      No tasks in {column.name.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
