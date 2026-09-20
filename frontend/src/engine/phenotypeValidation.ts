import { type PhenotypePoint, type Quantiles, type SavedPin } from "./phenotypes";

function check(condition: boolean): asserts condition {
  if (!condition) throw new Error("Invalid retained phenotype observation");
}
const count = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
function identity(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= 64;
}
function distributions(values: Quantiles[], size: number, population: number) {
  check(Array.isArray(values) && values.length === size);
  for (const v of values) {
    if (population === 0) {
      check(v === null);
      continue;
    }
    check(Array.isArray(v) && v.length === 3 && v.every((q) => Number.isFinite(q) && q >= 0));
    check(v[0] <= v[1] && v[1] <= v[2]);
  }
}
export function validatePhenotypePoint(p: PhenotypePoint | undefined, population: number) {
  if (p === undefined) return;
  check(!!p && identity(p.id) && count(p.count) && p.count <= population);
  distributions(p.actual, 7, p.count);
  distributions(p.target, 5, p.count);
}
export function validatePin(p: SavedPin | null | undefined, tick: number) {
  if (p === undefined || p === null) return;
  check(identity(p.id) && typeof p.label === "string" && p.label.length <= 120);
  check(count(p.started) && p.started <= tick);
  check(Array.isArray(p.roots) && p.roots.length > 0 && p.roots.length <= 100000);
  check(p.roots.every((n) => count(n) && n > 0) && new Set(p.roots).size === p.roots.length);
}
