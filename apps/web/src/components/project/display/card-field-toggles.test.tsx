import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { useUserPreferencesStore } from "@/store/user-preferences";
import { CardFieldToggles } from "./card-field-toggles";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

beforeEach(() => {
  useUserPreferencesStore.setState({ showDependencyBlocks: true });
});

afterEach(() => {
  cleanup();
});

describe("CardFieldToggles", () => {
  it("toggles dependency blocking on cards and restores it on reset", () => {
    render(<CardFieldToggles />);
    const toggle = screen.getByRole("button", {
      name: "tasks:display.dependencyBlocks",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);
    expect(useUserPreferencesStore.getState().showDependencyBlocks).toBe(false);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    useUserPreferencesStore.getState().resetDisplayPreferences();
    expect(useUserPreferencesStore.getState().showDependencyBlocks).toBe(true);
  });
});
