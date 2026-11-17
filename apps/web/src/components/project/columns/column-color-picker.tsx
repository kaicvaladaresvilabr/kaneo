import { useId, useState } from "react";
import { LabelColorSwatches } from "@/components/settings/labels/label-color-swatches";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { DEFAULT_COLUMN_COLOR, resolveColumnColor } from "@/lib/column-color";

type ColumnColorPickerProps = {
  selected?: string | null;
  label: string;
  disabled?: boolean;
  onSelect: (color: string) => void;
  onOpenChange?: (open: boolean) => void;
};

export function ColumnColorPicker({
  selected,
  label,
  disabled = false,
  onSelect,
  onOpenChange,
}: ColumnColorPickerProps) {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const value = selected?.trim() || DEFAULT_COLUMN_COLOR;

  const changeOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={changeOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          title={label}
          disabled={disabled}
          className="shrink-0 disabled:opacity-100"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-3.5 rounded-full ring-1 ring-foreground/15 ring-inset",
            )}
            style={{ backgroundColor: resolveColumnColor(value) }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <p id={headingId} className="sr-only">
          {label}
        </p>
        <div className="p-1">
          <LabelColorSwatches
            value={value}
            labelledBy={headingId}
            onChange={(color) => {
              onSelect(color);
              changeOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
