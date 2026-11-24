import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import createProject from "@/fetchers/project/create-project";

function useCreateProject({
  name,
  slug,
  workspaceId,
  icon,
}: {
  name: string;
  slug: string;
  workspaceId: string;
  icon: string;
}) {
  const { i18n } = useTranslation();
  return useMutation({
    mutationFn: () =>
      createProject({
        name,
        slug,
        workspaceId,
        icon,
        locale: i18n.resolvedLanguage ?? i18n.language,
      }),
  });
}

export default useCreateProject;
