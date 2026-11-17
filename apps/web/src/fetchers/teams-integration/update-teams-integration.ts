import { getApiUrl } from "@/fetchers/get-api-url";
import { HttpError } from "@/lib/http-error";
import type { TeamsEventToggles } from "./create-teams-integration";
import type { TeamsIntegration } from "./get-teams-integration";

export type UpdateTeamsIntegrationRequest = {
  webhookUrl?: string;
  channelName?: string | null;
  isActive?: boolean;
  events?: TeamsEventToggles;
  dueDateReminderLeadTimeMinutes?: number;
};

async function updateTeamsIntegration(
  projectId: string,
  json: UpdateTeamsIntegrationRequest,
) {
  const response = await fetch(
    getApiUrl(`/teams-integration/project/${projectId}`),
    {
      method: "PATCH",
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

export default updateTeamsIntegration;
