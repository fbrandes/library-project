import frontend from "../../frontend/eslint.config.js";
import bookinfo from "../../bookinfo/frontend/eslint.config.ts";
import renting from "../../renting/frontend/eslint.config.js";
import userManagement from "../../user-management/frontend/eslint.config.ts";

export default [
  ...frontend,
  ...bookinfo,
  ...renting,
  ...userManagement,
];
