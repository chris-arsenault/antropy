import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { sourceIdentity } from "./harness/sourceIdentity";

export default defineConfig({
  base: "./",
  plugins: [sourceIdentity(), react()],
  test: {
    environment: "happy-dom",
  },
});
