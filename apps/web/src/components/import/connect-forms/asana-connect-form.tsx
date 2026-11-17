import { useTranslation } from "react-i18next";
import { ASANA_EXPORT_MAX_CHARS } from "@/components/import/asana-export-limit";
import { ConnectFieldRow } from "@/components/import/connect-forms/connect-field-row";
import type { ConnectFormProps } from "@/components/import/connect-forms/connect-form-props";
import { fieldDescribedBy } from "@/components/import/connect-forms/field-ids";
import { Input } from "@/components/ui/input";

const FILE_ID = "import-asana-file";

export function AsanaConnectForm({
  values,
  onChange,
  error,
}: ConnectFormProps) {
  const { t } = useTranslation();
  const fileError = values.documentTooLarge
    ? t("settings:workspaceImport.asana.fileTooLarge")
    : error;

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      <ConnectFieldRow
        id={FILE_ID}
        labelFor={FILE_ID}
        label={t("settings:workspaceImport.asana.fileLabel")}
        description={t("settings:workspaceImport.asana.fileDescription")}
        error={fileError}
      >
        <Input
          id={FILE_ID}
          type="file"
          accept="application/json,.json"
          nativeInput
          aria-invalid={Boolean(fileError)}
          aria-describedby={fieldDescribedBy(FILE_ID, Boolean(fileError))}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > ASANA_EXPORT_MAX_CHARS) {
              onChange({
                document: "",
                fileName: file.name,
                documentTooLarge: true,
              });
              return;
            }
            void file.text().then((document) => {
              onChange({
                document,
                fileName: file.name,
                documentTooLarge: false,
              });
            });
          }}
        />
        {values.fileName ? (
          <p className="truncate text-muted-foreground text-xs">
            {values.fileName}
          </p>
        ) : null}
      </ConnectFieldRow>
    </div>
  );
}
