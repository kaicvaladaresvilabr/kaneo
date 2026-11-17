import { describe, expect, it } from "vite-plus/test";
import labelColors from "@/constants/label-colors";
import {
  DEFAULT_COLUMN_COLOR,
  isColumnColorValue,
  resolveColumnColor,
} from "./column-color";

describe("resolveColumnColor", () => {
  it("defaults empty values to blue", () => {
    expect(DEFAULT_COLUMN_COLOR).toBe("blue");
    expect(resolveColumnColor(null)).toBe(resolveColumnColor("blue"));
    expect(resolveColumnColor(undefined)).toBe(resolveColumnColor("blue"));
    expect(resolveColumnColor("  ")).toBe(resolveColumnColor("blue"));
  });

  it("maps palette names and keeps hex", () => {
    const blue = labelColors.find((color) => color.value === "blue");
    expect(blue).toBeDefined();
    expect(resolveColumnColor("blue")).toBe(blue?.color);
    expect(resolveColumnColor("#3B82F6")).toBe("#3B82F6");
  });
});

describe("isColumnColorValue", () => {
  it("accepts palette keys only", () => {
    expect(isColumnColorValue("blue")).toBe(true);
    expect(isColumnColorValue("#3b82f6")).toBe(false);
  });
});
