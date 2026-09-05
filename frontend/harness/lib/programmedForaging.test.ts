import { describe, expect, it } from "vitest";
import { measureProgrammedForaging, PROGRAMMED_FORAGING_GATE } from "./programmedForaging";

describe("programmed web-colony foraging", () => {
  it(
    "sustains population-level surface foraging in the exact review world",
    { timeout: 10_000 },
    () => {
      const result = measureProgrammedForaging(1);

      expect(result.exitParticipation).toBeGreaterThanOrEqual(
        PROGRAMMED_FORAGING_GATE.minExitParticipation
      );
      expect(result.surfacePresence).toBeGreaterThanOrEqual(
        PROGRAMMED_FORAGING_GATE.minSurfacePresence
      );
      expect(result.foragingParticipation).toBeGreaterThanOrEqual(
        PROGRAMMED_FORAGING_GATE.minForagingParticipation
      );
      expect(result.returnEfficiency).toBeGreaterThanOrEqual(
        PROGRAMMED_FORAGING_GATE.minReturnEfficiency
      );
      expect(result.productiveWindows).toBeGreaterThanOrEqual(
        PROGRAMMED_FORAGING_GATE.minProductiveWindows
      );
    }
  );
});
