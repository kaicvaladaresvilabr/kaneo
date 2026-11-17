import { create } from "zustand";
import { isTaskBlockedError, type TaskBlocker } from "@/lib/task-blocker";

type TaskBlockedDialogStore = {
  blockers: TaskBlocker[] | null;
  open: (blockers: TaskBlocker[]) => void;
  close: () => void;
};

export const useTaskBlockedDialogStore = create<TaskBlockedDialogStore>(
  (set) => ({
    blockers: null,
    open: (blockers) => set({ blockers }),
    close: () => set({ blockers: null }),
  }),
);

export function handleTaskBlockedError(error: unknown): boolean {
  if (!isTaskBlockedError(error)) return false;
  useTaskBlockedDialogStore.getState().open(error.blockers);
  return true;
}
