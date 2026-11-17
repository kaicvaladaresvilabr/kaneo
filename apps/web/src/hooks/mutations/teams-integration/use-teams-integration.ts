import { useMutation, useQueryClient } from "@tanstack/react-query";
import createTeamsIntegration, {
  type CreateTeamsIntegrationRequest,
} from "@/fetchers/teams-integration/create-teams-integration";
import deleteTeamsIntegration from "@/fetchers/teams-integration/delete-teams-integration";
import updateTeamsIntegration, {
  type UpdateTeamsIntegrationRequest,
} from "@/fetchers/teams-integration/update-teams-integration";

export function useCreateTeamsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: CreateTeamsIntegrationRequest;
    }) => createTeamsIntegration(projectId, data),
    onSuccess: (_, { projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["teams-integration", projectId],
      });
    },
  });
}

export function useUpdateTeamsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      json,
    }: {
      projectId: string;
      json: UpdateTeamsIntegrationRequest;
    }) => updateTeamsIntegration(projectId, json),
    onSuccess: (_, { projectId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["teams-integration", projectId],
      });
    },
  });
}

export function useDeleteTeamsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteTeamsIntegration(projectId),
    onSuccess: (_, projectId) => {
      void queryClient.invalidateQueries({
        queryKey: ["teams-integration", projectId],
      });
    },
  });
}
