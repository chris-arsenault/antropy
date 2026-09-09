import { maintainColony } from "./lifecycle";

/** Lifecycle currently owns broad colony mutation; it never executes controller decisions. */
export const lifecycleSystem = {
  id: "colony-lifecycle",
  version: 2,
  phase: "lifecycle" as const,
  run: maintainColony,
};
