import { type PhenotypeReport, type Activity } from "./phenotypes";

export function checkActivity(a: Activity | null | undefined) {
  if (a && (a.imports.rows.length > 8 || a.exports.rows.length > 8))
    throw new Error("Material activity exceeds eight displayed species per direction");
}
export function checkPhenotypeBudget(report: PhenotypeReport | null | undefined) {
  if (!report) return;
  if (report.groups.length !== 3 || (report.pin && typeof report.pin.roots !== "number"))
    throw new Error("Phenotype observation must contain three reductions and no member list");
  for (const group of report.groups) {
    if (group.actual.length !== 7 || group.target.length !== 5 || group.illumination.length !== 2)
      throw new Error("Phenotype trait reduction exceeds its display shape");
    checkActivity(group.activity);
  }
}
