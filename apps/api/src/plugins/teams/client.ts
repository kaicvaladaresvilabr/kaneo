import * as Sentry from "@sentry/node";
import { sendOutboundRequest } from "../../utils/outbound-request";
import type { TeamsCardLabels } from "./card-copy";
import { isOfficeConnectorUrl } from "./config";

export type TeamsCard = {
  title: string;
  body: string;
  taskLabel: string;
  taskUrl: string | null;
  projectName: string;
  status: string;
  priority: string;
  actorName: string | null;
  labels: TeamsCardLabels;
};

type AdaptiveCard = {
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json";
  type: "AdaptiveCard";
  version: "1.4";
  body: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
};

function facts(card: TeamsCard) {
  return [
    { title: card.labels.task, value: card.taskLabel },
    { title: card.labels.project, value: card.projectName },
    { title: card.labels.status, value: card.status },
    { title: card.labels.priority, value: card.priority },
    {
      title: card.labels.by,
      value: card.actorName ?? "Kaneo",
    },
  ];
}

function adaptiveCard(card: TeamsCard): AdaptiveCard {
  const content: AdaptiveCard = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: card.title,
        weight: "Bolder",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: card.body,
        wrap: true,
      },
      {
        type: "FactSet",
        facts: facts(card),
      },
    ],
  };

  if (card.taskUrl) {
    content.actions = [
      {
        type: "Action.OpenUrl",
        title: card.labels.openTask,
        url: card.taskUrl,
      },
    ];
  }

  return content;
}

function messageCard(card: TeamsCard) {
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    summary: card.title,
    title: card.title,
    text: [
      card.body,
      "",
      `${card.labels.task}: ${card.taskLabel}`,
      `${card.labels.project}: ${card.projectName}`,
      `${card.labels.status}: ${card.status}`,
      `${card.labels.priority}: ${card.priority}`,
      `${card.labels.by}: ${card.actorName ?? "Kaneo"}`,
    ].join("\n"),
    potentialAction: card.taskUrl
      ? [
          {
            "@type": "OpenUri",
            name: card.labels.openTask,
            targets: [{ os: "default", uri: card.taskUrl }],
          },
        ]
      : undefined,
  };
}

export function buildTeamsPayload(webhookUrl: string, card: TeamsCard) {
  if (isOfficeConnectorUrl(webhookUrl)) {
    return messageCard(card);
  }

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: adaptiveCard(card),
      },
    ],
  };
}

export async function postToTeams(
  webhookUrl: string,
  card: TeamsCard,
): Promise<void> {
  Sentry.addBreadcrumb({
    category: "integration",
    level: "info",
    data: { integration: "teams" },
  });
  await sendOutboundRequest(webhookUrl, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildTeamsPayload(webhookUrl, card)),
  });
}
