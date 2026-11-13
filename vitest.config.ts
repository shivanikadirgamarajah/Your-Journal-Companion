import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      include: [
        "lib/eventFeatures.ts",
        "lib/recsStore.ts",
        "lib/aiResponseValidation.ts",
        "app/api/analyze/route.ts",
      ],
    },
  },
});
