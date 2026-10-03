import { describe, expect, it } from "vitest";
import { fundedWork } from "./chemicalConsequenceReport";

describe("funded chemical consequence", () => {
  it("does not mistake assembly paid from founder reserves for new funded work", () => {
    expect(fundedWork({ initialCells: 1, livingEnergy: 0.1, flows: { growth: 0.3 } })).toBeCloseTo(
      -0.1
    );
  });
  it("keeps paid assembly but charges lost usable reserves after death", () => {
    expect(fundedWork({ initialCells: 2, livingEnergy: 0, flows: { growth: 0.7 } })).toBeCloseTo(
      -0.3
    );
  });
});
