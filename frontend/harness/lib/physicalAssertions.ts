/** Test-only comparisons of existing headless observations, including private neural state. */
import { expect } from "vitest";
import { type Engine, type EngineWorld } from "../../src/engine/client";

const discrete = new Set([
  "id",
  "parent",
  "lineage",
  "generation",
  "genome",
  "born",
  "ended",
  "task",
  "tick",
  "version",
  "seed",
  "environmentRng",
  "population",
  "ancestryRecords",
  "genomes",
  "lineages",
  "count",
  "births",
  "deaths",
  "divisions",
  "disturbanceDeaths",
]);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectNumber(actual: number, expected: number, path: string, key: string) {
  if (discrete.has(key)) expect(actual, path).toBe(expected);
  else
    expect(Math.abs(actual - expected), path).toBeLessThanOrEqual(1e-9 * (1 + Math.abs(expected)));
}

export function expectNumericallyEqual(actual: unknown, expected: unknown, path = "$", key = "") {
  if (Object.is(actual, expected)) return;
  if (typeof actual === "number" && typeof expected === "number") {
    expectNumber(actual, expected, path, key);
    return;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    expect(actual.length, path).toBe(expected.length);
    expected.forEach((value, i) => expectNumericallyEqual(actual[i], value, `${path}[${i}]`, key));
    return;
  }
  if (record(actual) && record(expected)) {
    expect(Object.keys(actual).sort(), path).toEqual(Object.keys(expected).sort());
    Object.entries(expected).forEach(([name, value]) =>
      expectNumericallyEqual(actual[name], value, `${path}.${name}`, name)
    );
    return;
  }
  expect(actual, path).toEqual(expected);
}

export function expectPhysicalState(a: EngineWorld, b: EngineWorld) {
  for (const op of ["assayFrame", "environment", "summary"])
    expectNumericallyEqual(a.command(op), b.command(op), op);
}

export function expectSavedPhysicalState(engine: Engine, a: Uint8Array, b: Uint8Array) {
  const left = engine.restore(a),
    right = engine.restore(b);
  try {
    expectPhysicalState(left, right);
  } finally {
    left.dispose();
    right.dispose();
  }
}
