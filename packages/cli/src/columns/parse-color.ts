import { Result } from "effect";
import { InvalidArgument } from "../errors/errors.js";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/iu;
const PALETTE = new Set([
  "gray",
  "dark-gray",
  "purple",
  "teal",
  "green",
  "yellow",
  "orange",
  "pink",
  "red",
  "blue",
  "sky",
  "cyan",
  "fuchsia",
]);

export function parseColor(
  input: string,
): Result.Result<string | null, InvalidArgument> {
  const value = input.trim();
  if (value.toLowerCase() === "none") return Result.succeed(null);
  const palette = value.toLowerCase();
  if (PALETTE.has(palette)) return Result.succeed(palette);
  const hex = HEX.exec(value)?.[1];
  if (!hex) {
    return Result.fail(
      new InvalidArgument({
        message: `--color "${input}" is not a hex color or palette name.`,
        hint: "Use a hex color such as #3b82f6, a name such as blue, or none to clear it.",
      }),
    );
  }
  const full =
    hex.length === 3
      ? [...hex].map((digit) => `${digit}${digit}`).join("")
      : hex;
  return Result.succeed(`#${full.toLowerCase()}`);
}
