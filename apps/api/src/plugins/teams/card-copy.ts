import azAZ from "../../../../../i18n/az-AZ.json";
import deDE from "../../../../../i18n/de-DE.json";
import elGR from "../../../../../i18n/el-GR.json";
import enUS from "../../../../../i18n/en-US.json";
import esES from "../../../../../i18n/es-ES.json";
import frFR from "../../../../../i18n/fr-FR.json";
import hiIN from "../../../../../i18n/hi-IN.json";
import idID from "../../../../../i18n/id-ID.json";
import itIT from "../../../../../i18n/it-IT.json";
import jaJP from "../../../../../i18n/ja-JP.json";
import koKR from "../../../../../i18n/ko-KR.json";
import mkMK from "../../../../../i18n/mk-MK.json";
import nlNL from "../../../../../i18n/nl-NL.json";
import plPL from "../../../../../i18n/pl-PL.json";
import ptBR from "../../../../../i18n/pt-BR.json";
import ruRU from "../../../../../i18n/ru-RU.json";
import trTR from "../../../../../i18n/tr-TR.json";
import ukUA from "../../../../../i18n/uk-UA.json";
import viVN from "../../../../../i18n/vi-VN.json";
import zhCN from "../../../../../i18n/zh-CN.json";
import zhTW from "../../../../../i18n/zh-TW.json";
import {
  resolveSupportedLocale,
  type SupportedLocale,
} from "../../utils/supported-locales";

type CardCopy = {
  task: string;
  project: string;
  status: string;
  priority: string;
  by: string;
  openTask: string;
  unknown: string;
  none: string;
  deleted: string;
  someone: string;
  taskCreatedTitle: string;
  taskCreatedBody: string;
  statusChangedTitle: string;
  statusChangedBody: string;
  priorityChangedTitle: string;
  priorityChangedBody: string;
  titleChangedTitle: string;
  titleChangedBody: string;
  descriptionChangedTitle: string;
  descriptionChangedBody: string;
  descriptionChangedBodyWithPreview: string;
  commentTitle: string;
  deletedTitle: string;
  deletedBody: string;
  movedTitle: string;
  movedBody: string;
  dueChangedTitle: string;
  dueChangedBody: string;
  assigneeChangedTitle: string;
  assigneeChangedBody: string;
  unassignedTitle: string;
  unassignedBody: string;
  dueSoonTitle: string;
  dueSoonBody: string;
};

type Bundle = {
  settings: { teamsIntegration: { card: CardCopy } };
  tasks: {
    status: Record<string, string>;
    priority: Record<string, string>;
  };
  notifications: { reminderLeadTime: Record<string, string> };
};

const bundles: Record<SupportedLocale, Bundle> = {
  "az-AZ": azAZ,
  "de-DE": deDE,
  "el-GR": elGR,
  "en-US": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "hi-IN": hiIN,
  "id-ID": idID,
  "it-IT": itIT,
  "ja-JP": jaJP,
  "ko-KR": koKR,
  "mk-MK": mkMK,
  "nl-NL": nlNL,
  "pl-PL": plPL,
  "pt-BR": ptBR,
  "ru-RU": ruRU,
  "tr-TR": trTR,
  "uk-UA": ukUA,
  "vi-VN": viVN,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};

const ENGLISH_STATUS_NAMES: Record<string, string> = {
  "to-do": "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
  archived: "Archived",
  planned: "Planned",
};

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(PLACEHOLDER, (_, key: string) => vars[key] ?? "");
}

function sentenceCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function plural(
  forms: Record<string, string>,
  prefix: string,
  count: number,
  locale: SupportedLocale,
) {
  const category = new Intl.PluralRules(locale).select(count);
  const template =
    forms[`${prefix}_${category}`] ?? forms[`${prefix}_other`] ?? "";
  return interpolate(template, { count: String(count) });
}

export type TeamsCardLabels = {
  task: string;
  project: string;
  status: string;
  priority: string;
  by: string;
  openTask: string;
};

export function teamsCardCopy(locale: string | null | undefined) {
  const resolved = resolveSupportedLocale(locale) ?? "en-US";
  const bundle = bundles[resolved];
  const card = bundle.settings.teamsIntegration.card;

  function text(template: string, vars: Record<string, string> = {}) {
    return interpolate(template, vars);
  }

  return {
    labels: {
      task: card.task,
      project: card.project,
      status: card.status,
      priority: card.priority,
      by: card.by,
      openTask: card.openTask,
    } satisfies TeamsCardLabels,
    unknown: card.unknown,
    none: card.none,
    deleted: card.deleted,
    someone: card.someone,
    text,
    taskCreatedTitle: card.taskCreatedTitle,
    taskCreatedBody: (taskTitle: string) =>
      text(card.taskCreatedBody, { taskTitle }),
    statusChangedTitle: card.statusChangedTitle,
    statusChangedBody: (
      taskTitle: string,
      oldStatus: string,
      newStatus: string,
    ) => text(card.statusChangedBody, { taskTitle, oldStatus, newStatus }),
    priorityChangedTitle: card.priorityChangedTitle,
    priorityChangedBody: (
      taskTitle: string,
      oldPriority: string,
      newPriority: string,
    ) =>
      text(card.priorityChangedBody, { taskTitle, oldPriority, newPriority }),
    titleChangedTitle: card.titleChangedTitle,
    titleChangedBody: (oldTitle: string, newTitle: string) =>
      text(card.titleChangedBody, { oldTitle, newTitle }),
    descriptionChangedTitle: card.descriptionChangedTitle,
    descriptionChangedBody: card.descriptionChangedBody,
    descriptionChangedBodyWithPreview: (preview: string) =>
      text(card.descriptionChangedBodyWithPreview, { preview }),
    commentTitle: card.commentTitle,
    deletedTitle: card.deletedTitle,
    deletedBody: (taskTitle: string) => text(card.deletedBody, { taskTitle }),
    movedTitle: card.movedTitle,
    movedBody: (fromProject: string, toProject: string) =>
      text(card.movedBody, { fromProject, toProject }),
    dueChangedTitle: card.dueChangedTitle,
    dueChangedBody: (taskTitle: string, oldDue: string, newDue: string) =>
      text(card.dueChangedBody, { taskTitle, oldDue, newDue }),
    assigneeChangedTitle: card.assigneeChangedTitle,
    assigneeChangedBody: (taskTitle: string, assignee: string) =>
      text(card.assigneeChangedBody, { taskTitle, assignee }),
    unassignedTitle: card.unassignedTitle,
    unassignedBody: (taskTitle: string) =>
      text(card.unassignedBody, { taskTitle }),
    dueSoonTitle: card.dueSoonTitle,
    dueSoonBody: (taskTitle: string, leadTime: string) =>
      text(card.dueSoonBody, { taskTitle, leadTime }),
    status(slug: string | null, columnName: string | null) {
      if (!slug) return card.unknown;
      const name = columnName?.trim();
      const englishDefault = ENGLISH_STATUS_NAMES[slug];
      if (name && name !== englishDefault && name.toLowerCase() !== slug) {
        return name;
      }
      return bundle.tasks.status[slug] ?? sentenceCase(slug);
    },
    priority(value: string | null) {
      if (!value) return card.unknown;
      return bundle.tasks.priority[value] ?? sentenceCase(value);
    },
    leadTime(minutes: number) {
      const forms = bundle.notifications.reminderLeadTime;
      if (minutes % 1440 === 0) {
        return plural(forms, "days", minutes / 1440, resolved);
      }
      if (minutes % 60 === 0) {
        return plural(forms, "hours", minutes / 60, resolved);
      }
      return plural(forms, "minutes", minutes, resolved);
    },
  };
}
