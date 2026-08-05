import { describe, expect, it } from "vitest";
import { USER_ROLES, USER_STATUSES } from "./userModels";

describe("generated user models", () => {
  it("contains roles and statuses from the OpenAPI spec", () => {
    expect(USER_ROLES).toEqual(["USER", "ADMIN", "LIBRARIAN"]);
    expect(USER_STATUSES).toEqual(["REGISTERED", "ACTIVE", "INACTIVE"]);
  });
});
