import { getApiUrl } from "@/fetchers/get-api-url";
import { HttpError } from "@/lib/http-error";
import type { TeamsIntegration } from "./get-teams-integration";

export type TeamsEventToggles = {
  taskCreated?: boolean;
  taskStatusChanged?: boolean;
  taskPriorityChanged?: boolean;
  taskTitleChanged?: boolean;
  taskDescriptionChanged?: boolean;
  taskCommentCreated?: boolean;
  taskDeleted?: boolean;
  taskMoved?: boolean;
  taskDueDateChanged?: boolean;
  taskAssigneeChanged?: boolean;
  taskUnassigned?: boolean;
  dueDateReminder?: boolean;
};

export type CreateTeamsIntegrationRequest = {
  webhookUrl: string;
  channelName?: string;
  events?: TeamsEventToggles;
  dueDateReminderLeadTimeMinutes?: number;
};

async function createTeamsIntegration(
  projectId: string,
  json: CreateTeamsIntegrationRequest,
) {
  const response = await fetch(
    getApiUrl(`/teams-integration/project/${projectId}`),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    },
  );

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return (await response.json()) as TeamsIntegration;
}

export default createTeamsIntegration;
