import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithTheme } from "../test/renderWithTheme";
import type { SearchField } from "../types/book";
import { SearchBar } from "./SearchBar";

interface SearchBarHarnessProps {
  isLoading?: boolean;
  onSubmit?: () => void;
}

function SearchBarHarness({
  isLoading = false,
  onSubmit = vi.fn(),
}: SearchBarHarnessProps) {
  const [field, setField] = useState<SearchField>("isbn");
  const [query, setQuery] = useState("");

  return (
    <SearchBar
      field={field}
      isLoading={isLoading}
      onFieldChange={setField}
      onQueryChange={setQuery}
      onSubmit={onSubmit}
      query={query}
    />
  );
}

describe("SearchBar", () => {
  it("updates the selected field and query before submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithTheme(<SearchBarHarness onSubmit={onSubmit} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Search by" }),
      "author",
    );
    await user.type(screen.getByLabelText("Search books"), "Joshua Bloch");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("combobox", { name: "Search by" })).toHaveValue(
      "author",
    );
    expect(screen.getByDisplayValue("Joshua Bloch")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables submit while loading", () => {
    renderWithTheme(<SearchBarHarness isLoading />);

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });
});
