import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { bookInfoStore } from "../stores/bookInfoStore";
import { renderWithTheme } from "../test/renderWithTheme";
import { ThemeModeToggle } from "./ThemeModeToggle";

describe("ThemeModeToggle", () => {
  beforeEach(() => {
    bookInfoStore.getState().reset("light");
  });

  it("toggles between light and dark mode", async () => {
    const user = userEvent.setup();

    renderWithTheme(<ThemeModeToggle />);

    const toggle = screen.getByRole("switch", { name: "Toggle dark mode" });

    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(bookInfoStore.getState().themeMode).toBe("dark");
  });
});
