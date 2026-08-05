import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/renting/",
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8082",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,svelte}"],
      exclude: [
        "src/main.ts",
        "src/vite-env.d.ts",
        "src/test/**",
        "src/custom-elements.d.ts",
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
