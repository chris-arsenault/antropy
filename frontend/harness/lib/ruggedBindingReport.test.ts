import { expect, it } from "vitest";
import { reciprocalSquare } from "./ruggedBindingReport";
import { LABELS } from "./ruggedBindingFixture";

type Case = Parameters<typeof reciprocalSquare>[0][number];
function square(returns: number[]): Case[] {
  // Deliberately narrow input: the gate must depend on measured endpoints and error bounds.
  return LABELS.map(
    (label, i) =>
      ({
        label,
        return: returns[i],
        returnError: 1e-9,
        endpointMeasured: true,
        accounted: true,
      }) as Case
  );
}
it("rejects a monotone landscape even when both endpoints grow", () => {
  expect(reciprocalSquare(square([3, 2, 2, 1])).passed).toBe(false);
  expect(reciprocalSquare(square([3, 1, 1, 2])).passed).toBe(true);
});
it("cannot pass missing, incomplete, unaccounted or unresolved comparisons", () => {
  const cases = square([3, 1, 1, 2]);
  expect(() => reciprocalSquare(cases.slice(0, 3))).toThrow();
  expect(() => reciprocalSquare([cases[0], cases[0], cases[2], cases[3]])).toThrow();
  cases[3].endpointMeasured = false;
  expect(reciprocalSquare(cases).passed).toBe(false);
  cases[3].endpointMeasured = true;
  cases[3].accounted = false;
  expect(reciprocalSquare(cases).passed).toBe(false);
  expect(reciprocalSquare(square([2, 1, 1, 1 + 1e-10])).passed).toBe(false);
});
