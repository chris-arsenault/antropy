import { PHENOTYPE_TRAITS, type PhenotypeReport, type Activity } from "./phenotypes";
const TRAIT_COUNTS = new Set([7, PHENOTYPE_TRAITS.length]);

export function checkActivity(a: Activity | null | undefined) {
  if (a && (a.imports.rows.length > 8 || a.exports.rows.length > 8))
    throw new Error("Material activity exceeds eight displayed species per direction");
}
export function checkPhenotypeBudget(report: PhenotypeReport | null | undefined) {
  if (!report) return;
  if (report.groups.length !== 3 || (report.pin && typeof report.pin.roots !== "number"))
    throw new Error("Phenotype observation must contain three reductions and no member list");
  for (const group of report.groups) {
    // The continuing server can publish the original seven traits before a v49 cutover.
    if (
      !TRAIT_COUNTS.has(group.actual.length) ||
      group.target.length !== 5 ||
      (group.illumination !== null && !Number.isFinite(group.illumination))
    )
      throw new Error("Phenotype trait reduction exceeds its display shape");
    checkActivity(group.activity);
  }
}
