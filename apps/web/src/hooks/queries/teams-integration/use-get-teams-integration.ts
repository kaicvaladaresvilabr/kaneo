import { useQuery } from "@tanstack/react-query";
import getTeamsIntegration from "@/fetchers/teams-integration/get-teams-integration";

function useGetTeamsIntegration(
  projectId: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["teams-integration", projectId],
    queryFn: () => getTeamsIntegration(projectId),
    enabled: enabled && Boolean(projectId),
  });
}

export default useGetTeamsIntegration;
