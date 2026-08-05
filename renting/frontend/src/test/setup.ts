import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

if (
  typeof ElementInternals !== "undefined" &&
  typeof ElementInternals.prototype.setFormValue !== "function"
) {
  Object.defineProperty(ElementInternals.prototype, "setFormValue", {
    configurable: true,
    value: () => undefined,
  });
}

afterEach(() => {
  cleanup();
});
