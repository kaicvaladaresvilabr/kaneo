import labelColors from "@/constants/label-colors";
import { resolveLabelColor } from "@/lib/label-color";

export const DEFAULT_COLUMN_COLOR = "blue";

export function resolveColumnColor(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return resolveLabelColor(DEFAULT_COLUMN_COLOR);
  }

  return resolveLabelColor(trimmed);
}

export function isColumnColorValue(value: string): boolean {
  return labelColors.some((color) => color.value === value);
}
