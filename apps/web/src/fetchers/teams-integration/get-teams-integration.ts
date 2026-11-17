import { getApiUrl } from "@/fetchers/get-api-url";
import { HttpError } from "@/lib/http-error";

export type TeamsIntegration = {
  id: string;
  projectId: string;
  channelName: string | null;
  webhookConfigured: boolean;
  maskedWebhookUrl: string;
  events: {
    taskCreated: boolean;
    taskStatusChanged: boolean;
    taskPriorityChanged: boolean;
    taskTitleChanged: boolean;
    taskDescriptionChanged: boolean;
    taskCommentCreated: boolean;
    taskDeleted: boolean;
    taskMoved: boolean;
    taskDueDateChanged: boolean;
    taskAssigneeChanged: boolean;
    taskUnassigned: boolean;
    dueDateReminder: boolean;
  };
  dueDateReminderLeadTimeMinutes: number;
  isActive: boolean | null;
  createdAt: string;
  updatedAt: string;
} | null;

async function getTeamsIntegration(projectId: string) {
  const response = await fetch(
    getApiUrl(`/teams-integration/project/${projectId}`),
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw await HttpError.fromResponse(response);
  }

  return (await response.json()) as TeamsIntegration;
}

export default getTeamsIntegration;
