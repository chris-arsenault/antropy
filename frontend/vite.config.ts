import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { sourceIdentity } from "./harness/sourceIdentity";

export default defineConfig({
  base: "./",
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  plugins: [sourceIdentity(), react()],
  worker: { format: "es", plugins: () => [sourceIdentity()] },
  test: {
    environment: "happy-dom",
    // Each file can own a WASM world; bound CPU and memory on shared development hosts.
    maxWorkers: 1,
    exclude: [...configDefaults.exclude, "harness/artifacts/**"],
  },
});
