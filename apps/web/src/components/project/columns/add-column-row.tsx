import { Plus } from "lucide-react";
import { type FocusEvent, type KeyboardEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ColumnColorPicker } from "@/components/project/columns/column-color-picker";
import { ColumnIconPicker } from "@/components/project/columns/column-icon-picker";
import { getColumnIcon } from "@/lib/column";
import { DEFAULT_COLUMN_COLOR } from "@/lib/column-color";

type AddColumnRowProps = {
  onCreate: (column: {
    name: string;
    icon: string;
    color: string;
  }) => Promise<boolean>;
};

const DEFAULT_ICON = "Circle";

export function AddColumnRow({ onCreate }: AddColumnRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [color, setColor] = useState(DEFAULT_COLUMN_COLOR);
  const [saving, setSaving] = useState(false);
  const pickerOpen = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setEditing(false);
    setName("");
    setIcon(DEFAULT_ICON);
    setColor(DEFAULT_COLUMN_COLOR);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    const created = await onCreate({ name: trimmed, icon, color });
    setSaving(false);
    if (created) {
      setName("");
      setIcon(DEFAULT_ICON);
      setColor(DEFAULT_COLUMN_COLOR);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (pickerOpen.current || name.trim()) return;
    if (event.currentTarget.contains(event.relatedTarget)) return;
    close();
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-11 w-full items-center gap-2.5 px-4 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:bg-accent/40 focus-visible:text-foreground"
      >
        <span aria-hidden="true" className="w-3.5 shrink-0" />
        <span className="flex size-7 shrink-0 items-center justify-center">
          <Plus aria-hidden="true" className="size-3.5" />
        </span>
        {t("settings:columnEditor.addColumn")}
      </button>
    );
  }

  return (
    <div onBlur={handleBlur} className="flex h-12 items-center gap-2.5 px-4">
      <span aria-hidden="true" className="w-3.5 shrink-0" />
      <ColumnIconPicker
        selected={icon}
        label={t("settings:columnEditor.pickIconTitle")}
        onSelect={setIcon}
        onOpenChange={(open) => {
          pickerOpen.current = open;
          if (!open) inputRef.current?.focus();
        }}
      >
        {getColumnIcon("", false, icon, color)}
      </ColumnIconPicker>
      <ColumnColorPicker
        selected={color}
        label={t("settings:columnEditor.pickColorTitle")}
        onSelect={setColor}
        onOpenChange={(open) => {
          pickerOpen.current = open;
          if (!open) inputRef.current?.focus();
        }}
      />
      <input
        ref={inputRef}
        autoFocus
        value={name}
        readOnly={saving}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("settings:columnEditor.newColumnPlaceholder")}
        aria-label={t("settings:columnEditor.newColumnPlaceholder")}
        className="-ml-2 h-7.5 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none placeholder:text-muted-foreground/72 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24 dark:bg-input/32"
      />
      <span aria-hidden="true" className="w-13 shrink-0" />
      <span aria-hidden="true" className="w-7 shrink-0" />
    </div>
  );
}
