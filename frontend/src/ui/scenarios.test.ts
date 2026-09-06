import { describe, expect, it } from "vitest";
import { SCENARIOS } from "./scenarios";

describe("single-forager scenarios", () => {
  it("exposes only the matched full-map and sensor-limited review arms", () => {
    expect(SCENARIOS.map(({ id }) => id)).toEqual(["omniscient-single", "sensor-limited-single"]);
  });
});
