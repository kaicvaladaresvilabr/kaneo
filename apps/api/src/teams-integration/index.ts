import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../database";
import { integrationTable } from "../database/schema";
import { deletedSchema, projectIdParam } from "../integrations/schema";
import {
  apiRouter,
  type BaseVariables,
  createRoute,
  errorResponse,
  jsonResponse,
} from "../openapi";
import {
  defaultTeamsEvents,
  maskTeamsWebhookUrl,
  normalizeTeamsConfig,
  type TeamsConfig,
  validateTeamsConfig,
} from "../plugins/teams/config";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import { teamsIntegrationSchema } from "./response";
import { createTeamsBody, updateTeamsBody } from "./schema";

function toResponse(integration: {
  id: string;
  projectId: string;
  config: string;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const config = normalizeTeamsConfig(
    JSON.parse(integration.config) as TeamsConfig,
  );

  return {
    id: integration.id,
    projectId: integration.projectId,
    channelName: config.channelName ?? null,
    webhookConfigured: Boolean(config.webhookUrl),
    maskedWebhookUrl: maskTeamsWebhookUrl(config.webhookUrl),
    events: {
      ...defaultTeamsEvents,
      ...config.events,
    },
    dueDateReminderLeadTimeMinutes:
      config.dueDateReminderLeadTimeMinutes ?? 1440,
    isActive: integration.isActive,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

async function getTeamsIntegration(projectId: string) {
  const integration = await db.query.integrationTable.findFirst({
    where: and(
      eq(integrationTable.projectId, projectId),
      eq(integrationTable.type, "teams"),
    ),
  });

  if (!integration) {
    return null;
  }

  return toResponse(integration);
}

const manageAccess = [
  workspaceAccess.fromProject("projectId"),
  requireWorkspacePermission({ workspace: ["manage_settings"] }),
];

const getTeamsIntegrationRoute = createRoute({
  method: "get",
  operationId: "getTeamsIntegration",
  path: "/project/{projectId}",
  tags: ["Teams"],
  summary: "Get Teams integration",
  description:
    "Get the Microsoft Teams integration for a project, or null when none is configured.",
  middleware: [
    workspaceAccess.fromProject("projectId"),
    requireWorkspacePermission({ project: ["read"] }),
  ] as const,
  request: { params: projectIdParam },
  responses: {
    200: jsonResponse(
      "Teams integration details, or null",
      teamsIntegrationSchema.nullable(),
    ),
    403: errorResponse(
      "No access to the project, or missing project:read permission",
    ),
    404: errorResponse("Project not found"),
  },
});

const createTeamsIntegrationRoute = createRoute({
  method: "post",
  operationId: "createTeamsIntegration",
  path: "/project/{projectId}",
  tags: ["Teams"],
  summary: "Create Teams integration",
  description:
    "Create or replace the Teams integration for a project. The webhook URL is checked for shape only; delivery failures surface later.",
  middleware: manageAccess,
  request: {
    params: projectIdParam,
    body: {
      required: true,
      content: { "application/json": { schema: createTeamsBody } },
    },
  },
  responses: {
    200: jsonResponse(
      "The stored integration",
      teamsIntegrationSchema.nullable(),
    ),
    400: errorResponse("The webhook URL failed validation"),
    403: errorResponse(
      "No access to the project, or missing workspace:manage_settings",
    ),
    404: errorResponse("Project not found"),
  },
});

const updateTeamsIntegrationRoute = createRoute({
  method: "patch",
  operationId: "updateTeamsIntegration",
  path: "/project/{projectId}",
  tags: ["Teams"],
  summary: "Update Teams integration",
  description:
    "Update the Teams integration. Omitted fields keep their current value, and event toggles are merged into the existing set.",
  middleware: manageAccess,
  request: {
    params: projectIdParam,
    body: {
      required: true,
      content: { "application/json": { schema: updateTeamsBody } },
    },
  },
  responses: {
    200: jsonResponse(
      "The updated integration",
      teamsIntegrationSchema.nullable(),
    ),
    400: errorResponse("The resulting config failed validation"),
    403: errorResponse(
      "No access to the project, or missing workspace:manage_settings",
    ),
    404: errorResponse("Project or Teams integration not found"),
  },
});

const deleteTeamsIntegrationRoute = createRoute({
  method: "delete",
  operationId: "deleteTeamsIntegration",
  path: "/project/{projectId}",
  tags: ["Teams"],
  summary: "Delete Teams integration",
  description: "Remove the Teams integration from a project.",
  middleware: manageAccess,
  request: { params: projectIdParam },
  responses: {
    200: jsonResponse("The integration was removed", deletedSchema),
    403: errorResponse(
      "No access to the project, or missing workspace:manage_settings",
    ),
    404: errorResponse("Project or Teams integration not found"),
  },
});

const teamsIntegration = apiRouter<BaseVariables & { workspaceId: string }>()
  .openapi(getTeamsIntegrationRoute, async (c) => {
    const { projectId } = c.req.valid("param");
    return c.json(await getTeamsIntegration(projectId), 200);
  })
  .openapi(createTeamsIntegrationRoute, async (c) => {
    const { projectId } = c.req.valid("param");
    const body = c.req.valid("json");

    const config = normalizeTeamsConfig({
      webhookUrl: body.webhookUrl,
      channelName: body.channelName,
      events: body.events,
      dueDateReminderLeadTimeMinutes: body.dueDateReminderLeadTimeMinutes,
    });

    const validation = await validateTeamsConfig(config);
    if (!validation.valid) {
      throw new HTTPException(400, {
        message: validation.errors?.join(", ") ?? "Invalid config",
      });
    }

    const existing = await db.query.integrationTable.findFirst({
      where: and(
        eq(integrationTable.projectId, projectId),
        eq(integrationTable.type, "teams"),
      ),
    });

    if (existing) {
      await db
        .update(integrationTable)
        .set({
          config: JSON.stringify(config),
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(integrationTable.id, existing.id));
    } else {
      await db.insert(integrationTable).values({
        projectId,
        type: "teams",
        config: JSON.stringify(config),
        isActive: true,
      });
    }

    return c.json(await getTeamsIntegration(projectId), 200);
  })
  .openapi(updateTeamsIntegrationRoute, async (c) => {
    const { projectId } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await db.query.integrationTable.findFirst({
      where: and(
        eq(integrationTable.projectId, projectId),
        eq(integrationTable.type, "teams"),
      ),
    });

    if (!existing) {
      throw new HTTPException(404, {
        message: "Teams integration not found",
      });
    }

    const currentConfig = normalizeTeamsConfig(
      JSON.parse(existing.config) as TeamsConfig,
    );
    const nextConfig = normalizeTeamsConfig({
      webhookUrl: body.webhookUrl?.trim() || currentConfig.webhookUrl,
      channelName:
        body.channelName === undefined
          ? currentConfig.channelName
          : (body.channelName ?? undefined),
      events: {
        ...currentConfig.events,
        ...body.events,
      },
      dueDateReminderLeadTimeMinutes:
        body.dueDateReminderLeadTimeMinutes ??
        currentConfig.dueDateReminderLeadTimeMinutes,
    });

    const validation = await validateTeamsConfig(nextConfig);
    if (!validation.valid) {
      throw new HTTPException(400, {
        message: validation.errors?.join(", ") ?? "Invalid config",
      });
    }

    await db
      .update(integrationTable)
      .set({
        config: JSON.stringify(nextConfig),
        isActive:
          body.isActive !== undefined
            ? body.isActive
            : (existing.isActive ?? true),
        updatedAt: new Date(),
      })
      .where(eq(integrationTable.id, existing.id));

    return c.json(await getTeamsIntegration(projectId), 200);
  })
  .openapi(deleteTeamsIntegrationRoute, async (c) => {
    const { projectId } = c.req.valid("param");

    const existing = await db.query.integrationTable.findFirst({
      where: and(
        eq(integrationTable.projectId, projectId),
        eq(integrationTable.type, "teams"),
      ),
    });

    if (!existing) {
      throw new HTTPException(404, {
        message: "Teams integration not found",
      });
    }

    await db
      .delete(integrationTable)
      .where(eq(integrationTable.id, existing.id));
    return c.json({ success: true }, 200);
  });

export default teamsIntegration;
