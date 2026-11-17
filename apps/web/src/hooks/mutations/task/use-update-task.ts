import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleTaskBlockedError } from "@/components/task/task-blocked-dialog-store";
import { invalidateMyWork } from "@/lib/invalidate-my-work";
import updateTask from "@/fetchers/task/update-task";
import type Task from "@/types/task";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => updateTask(task.id, task),
    onError: (error) => {
      handleTaskBlockedError(error);
    },
    onSuccess: (_, variables) => {
      invalidateMyWork(queryClient);
      queryClient.invalidateQueries({
        queryKey: ["task", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.id],
      });
    },
  });
}
