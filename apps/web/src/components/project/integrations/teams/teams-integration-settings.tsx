import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { UnplugIcon, PlugIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DeliveryActiveRow } from "@/components/project/integrations/delivery-panel/delivery-active-row";
import { DeliveryFooter } from "@/components/project/integrations/delivery-panel/delivery-footer";
import { DeliveryPanelSkeleton } from "@/components/project/integrations/delivery-panel/delivery-panel-skeleton";
import { GenericWebhookEventChecklist } from "@/components/project/integrations/generic-webhook/generic-webhook-event-checklist";
import { IntegrationPanel } from "@/components/project/integrations/panel/integration-panel";
import { IntegrationPanelSection } from "@/components/project/integrations/panel/integration-panel-section";
import { Form } from "@/components/ui/form";
import {
  useCreateTeamsIntegration,
  useDeleteTeamsIntegration,
  useUpdateTeamsIntegration,
} from "@/hooks/mutations/teams-integration/use-teams-integration";
import useGetTeamsIntegration from "@/hooks/queries/teams-integration/use-get-teams-integration";
import { toast } from "@/lib/toast";
import { buildTeamsRequest } from "./build-teams-request";
import { TeamsFields } from "./teams-fields";
import {
  createTeamsFormSchema,
  type TeamsFormValues,
  toTeamsFormValues,
} from "./teams-form-values";

export function TeamsIntegrationSettings({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const schema = React.useMemo(
    () =>
      createTeamsFormSchema(
        t("settings:genericWebhookIntegration.validation.leadTimeRange"),
      ),
    [t],
  );

  const { data: integration, isLoading } = useGetTeamsIntegration(projectId);
  const { mutateAsync: createIntegration, isPending: isCreating } =
    useCreateTeamsIntegration();
  const { mutateAsync: updateIntegration, isPending: isUpdating } =
    useUpdateTeamsIntegration();
  const { mutateAsync: deleteIntegration, isPending: isDeleting } =
    useDeleteTeamsIntegration();

  const normalizedValues = React.useMemo(
    () => toTeamsFormValues(integration),
    [integration],
  );

  const form = useForm<TeamsFormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: normalizedValues,
  });
  const { reset } = form;

  React.useEffect(() => {
    reset(normalizedValues);
  }, [normalizedValues, reset]);

  const isConnected = Boolean(integration?.webhookConfigured);
  const isBusy = isCreating || isUpdating || isDeleting;

  const onSubmit = async (values: TeamsFormValues) => {
    const request = buildTeamsRequest(values, isConnected);

    if (request.kind === "invalid") {
      form.setError("webhookUrl", {
        message: t("settings:teamsIntegration.validation.webhookInvalid"),
      });
      return;
    }

    try {
      if (request.kind === "create") {
        await createIntegration({ projectId, data: request.data });
      } else {
        await updateIntegration({ projectId, json: request.json });
      }

      form.reset({ ...values, webhookUrl: "" });
      toast.success(t("settings:teamsIntegration.toast.saved"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:teamsIntegration.toast.saveError"),
      );
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    try {
      await updateIntegration({ projectId, json: { isActive: checked } });
      toast.success(
        checked
          ? t("settings:teamsIntegration.toast.enabled")
          : t("settings:teamsIntegration.toast.disabled"),
        { icon: checked ? PlugIcon : UnplugIcon },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:teamsIntegration.toast.updateError"),
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await deleteIntegration(projectId);
      form.reset(toTeamsFormValues(null));
      toast.success(t("settings:teamsIntegration.toast.removed"), {
        icon: UnplugIcon,
      });
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:teamsIntegration.toast.removeError"),
      );
      return false;
    }
  };

  if (isLoading) {
    return <DeliveryPanelSkeleton />;
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <IntegrationPanel>
          <IntegrationPanelSection className="space-y-4">
            {isConnected ? (
              <DeliveryActiveRow
                checked={integration?.isActive ?? false}
                description={t("settings:chatIntegrations.activeDescription")}
                disabled={isBusy}
                onCheckedChange={handleToggleActive}
                title={t("settings:chatIntegrations.activeTitle", {
                  provider: "Teams",
                })}
              />
            ) : null}
            <TeamsFields connected={isConnected} control={form.control} />
            <GenericWebhookEventChecklist control={form.control} />
          </IntegrationPanelSection>
          <DeliveryFooter
            busy={isBusy}
            connectLabel={t("settings:teamsIntegration.connect")}
            connected={isConnected}
            disconnectDescription={t(
              "settings:chatIntegrations.disconnectDescription",
              { provider: "Teams" },
            )}
            disconnectTitle={t("settings:chatIntegrations.disconnectTitle", {
              provider: "Teams",
            })}
            disconnecting={isDeleting}
            onDisconnect={handleDisconnect}
          />
        </IntegrationPanel>
      </form>
    </Form>
  );
}
