import { type runQuick } from "./quickRun";
import { type ConsequenceCase, consequenceName } from "./chemicalConsequenceFixture";

type Result = Awaited<ReturnType<typeof runQuick>>;
const all = (...conditions: boolean[]) => conditions.every(Boolean);
const invalidNumber = (v: unknown) => typeof v === "number" && !Number.isFinite(v);
export interface ConsequenceRun {
  name: string;
  case: ConsequenceCase;
  shared: boolean;
  swap: boolean;
  result: Result;
}

export function fundedWork(
  group: Pick<Result["groups"][number], "livingEnergy" | "initialCells"> & {
    flows: Pick<Result["groups"][number]["flows"], "growth">;
  }
): number {
  return group.livingEnergy + group.flows.growth - 0.5 * group.initialCells;
}

export function consequenceMeasurement(run: ConsequenceRun, group = run.result.groups[0]) {
  if (!group) throw new Error("Missing founder group");
  if (!all(group.organismSeconds > 0, group.meanDamagePercent !== null))
    throw new Error("Missing group exposure time or damage");
  const result = run.result;
  const energyError = result.maxEnergyResidualPercent;
  const materialError = result.maxMaterialResidualPercent;
  if (energyError === null || materialError === null)
    throw new Error("Missing account measurements");
  const allowance = Math.max(
    1e-8,
    (energyError / 100) * (result.final.ledger.initialEnergy + result.final.ledger.suppliedEnergy)
  );
  const row = {
    name: run.name,
    genome: group.genome,
    ticks: result.ticks,
    stop: result.stop,
    W: fundedWork(group),
    allowance,
    conversion136to8: group.speciesFlows
      .filter((f) => f.channel === "reaction" && f.species === 136 && f.product === 8)
      .reduce((sum, f) => sum + f.amount, 0),
    uptake136: group.speciesFlows
      .filter((f) => f.channel === "imported" && f.species === 136)
      .reduce((sum, f) => sum + f.amount, 0),
    exposurePerSecond: group.flows.exposure / group.organismSeconds,
    injuryPerSecond: group.flows.damage / group.organismSeconds,
    repairWorkPerSecond: group.flows.repair / group.organismSeconds,
    meanDamagePercent: group.meanDamagePercent,
    growthWork: group.flows.growth,
    grownMaterial: group.flows.grown,
    livingEnergy: group.livingEnergy,
    initialBiomass: group.initialBiomass,
    finalLivingBiomass: group.livingBiomass,
    living: group.living,
    deaths: group.deaths,
    births: group.births,
    organismSeconds: group.organismSeconds,
    flows: group.flows,
    complete: result.completed || result.stop === "extinction",
    accountsClosed: energyError / 100 <= 1e-7 && materialError / 100 <= 1e-7,
    maxEnergyResidualPercent: energyError,
    maxMaterialResidualPercent: materialError,
  };
  if (
    Object.values(row).some(invalidNumber) ||
    Object.values(group.flows).some((v) => !Number.isFinite(v))
  )
    throw new Error("Nonfinite consequence measurement");
  return row;
}

export function consequenceReport(runs: ConsequenceRun[]) {
  const rows = runs.map((r) => consequenceMeasurement(r));
  const get = (variant: number, supplied: boolean, enzymeActive = true, lambda = 6) => {
    const name = consequenceName({ variant, supplied, enzymeActive, lambda });
    const row = rows.find((r) => r.name === name);
    if (!row) throw new Error(`Missing registered case ${name}`);
    return row;
  };
  const good = get(3, true),
    blank = get(3, false),
    off = get(3, true, false);
  const parent = get(2, true),
    bad = get(0, true),
    badBlank = get(0, false);
  const greater = (a: typeof good, b: typeof good) => a.W - b.W > a.allowance + b.allowance;
  const checks = {
    complete: all(
      rows.length === 16,
      rows.every((r) => r.complete)
    ),
    accountsClosed: rows.every((r) => r.accountsClosed),
    positiveFundedWork: good.W > good.allowance,
    enzymeDependentWork: all(greater(good, off), greater(good, parent), greater(good, blank)),
    enzymeDependentConversion: all(
      good.conversion136to8 > 1e-8,
      good.conversion136to8 - parent.conversion136to8 > 1e-8,
      good.conversion136to8 - off.conversion136to8 > 1e-8
    ),
    extraFundedAssembly: all(
      good.growthWork - blank.growthWork > 1e-8,
      good.growthWork - off.growthWork > 1e-8
    ),
    enzymeOffNotPositive: [off, get(2, true, false)].every((r) => r.W <= r.allowance),
    suppliedInjury: all(
      bad.exposurePerSecond - badBlank.exposurePerSecond > 1e-8,
      bad.injuryPerSecond - badBlank.injuryPerSecond > 1e-8
    ),
    protectionReducesBurden: all(
      bad.exposurePerSecond - parent.exposurePerSecond > 1e-8,
      bad.injuryPerSecond - parent.injuryPerSecond > 1e-8,
      bad.repairWorkPerSecond - parent.repairWorkPerSecond > 1e-8 ||
        bad.meanDamagePercent! - parent.meanDamagePercent! > 1e-8
    ),
    damagingWorkConsequence: all(bad.W < -bad.allowance, greater(badBlank, bad)),
  };
  const valid = all(checks.complete, checks.accountsClosed);
  const fuelGain = all(
    valid,
    checks.positiveFundedWork,
    checks.enzymeDependentWork,
    checks.enzymeDependentConversion,
    checks.extraFundedAssembly,
    checks.enzymeOffNotPositive
  );
  const protectionLoss = all(valid, checks.suppliedInjury, checks.protectionReducesBurden);
  const oppositeConsequences = all(fuelGain, protectionLoss, checks.damagingWorkConsequence);
  return {
    checks,
    fuelGain,
    protectionLoss,
    oppositeConsequences,
    sharedAuthorized: oppositeConsequences,
    highLambdaWorkContrast: good.W - bad.W,
    lowLambdaWorkContrast: get(3, true, true, 0.25).W - get(0, true, true, 0.25).W,
    rows,
  };
}
