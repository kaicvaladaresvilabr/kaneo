import { CheckCircle2, Circle } from "lucide-react";
import columnIcons, {
  DEFAULT_COLUMN_ICON_NAMES,
} from "@/constants/column-icons";
import { resolveColumnColor } from "@/lib/column-color";

export const getColumnIcon = (
  columnId: string,
  isFinal?: boolean,
  iconName?: string | null,
  color?: string | null,
) => {
  const resolvedIconName =
    iconName ||
    (Object.hasOwn(DEFAULT_COLUMN_ICON_NAMES, columnId)
      ? DEFAULT_COLUMN_ICON_NAMES[
          columnId as keyof typeof DEFAULT_COLUMN_ICON_NAMES
        ]
      : undefined);
  const Icon =
    typeof resolvedIconName === "string" &&
    Object.hasOwn(columnIcons, resolvedIconName) &&
    columnIcons[resolvedIconName as keyof typeof columnIcons];
  const style = { color: resolveColumnColor(color) };

  if (Icon) {
    return <Icon className="h-4 w-4" style={style} />;
  }

  return isFinal ? (
    <CheckCircle2 className="h-4 w-4" style={style} />
  ) : (
    <Circle className="h-4 w-4" style={style} />
  );
};
