import type { IntegrationPlugin } from "../types";
import { validateTeamsConfig } from "./config";
import {
  handleTaskAssigneeChanged,
  handleTaskCommentCreated,
  handleTaskCreated,
  handleTaskDeleted,
  handleTaskDescriptionChanged,
  handleTaskDueDateChanged,
  handleTaskMoved,
  handleTaskPriorityChanged,
  handleTaskStatusChanged,
  handleTaskTitleChanged,
  handleTaskUnassigned,
} from "./events";

export const teamsPlugin: IntegrationPlugin = {
  type: "teams",
  name: "Teams",
  onTaskCreated: handleTaskCreated,
  onTaskStatusChanged: handleTaskStatusChanged,
  onTaskPriorityChanged: handleTaskPriorityChanged,
  onTaskTitleChanged: handleTaskTitleChanged,
  onTaskDescriptionChanged: handleTaskDescriptionChanged,
  onTaskCommentCreated: handleTaskCommentCreated,
  onTaskDeleted: handleTaskDeleted,
  onTaskMoved: handleTaskMoved,
  onTaskDueDateChanged: handleTaskDueDateChanged,
  onTaskAssigneeChanged: handleTaskAssigneeChanged,
  onTaskUnassigned: handleTaskUnassigned,
  validateConfig: validateTeamsConfig,
};
