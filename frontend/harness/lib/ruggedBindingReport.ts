import { type QuickObserver } from "./quickObserver";
import { type runQuick } from "./quickRun";
import { LABELS } from "./ruggedBindingFixture";

export type BindingRun = Awaited<ReturnType<typeof runQuick>>;
export interface BindingCase {
  label: (typeof LABELS)[number];
  lambda: number;
  empty: boolean;
  result: BindingRun;
  frames: ReturnType<QuickObserver["frame"]>[];
}

export function measuredCase(c: BindingCase) {
  if (c.result.groups.length !== 1) throw new Error("Expected exactly one founder group");
  const g = c.result.groups[0];
  const values = [g.initialBiomass, g.livingBiomass, g.livingInventory, g.livingEnergy];
  if (values.some((v) => !Number.isFinite(v)) || g.initialBiomass <= 0)
    throw new Error("Missing or invalid physical stocks");
  const stockReturn = (mass: number) => (mass - g.initialBiomass) / g.initialBiomass;
  const transient = [100, 200, 300].map((tick) => {
    const frame = c.frames.find((f) => f.tick === tick);
    const mass = frame?.cells.reduce((sum, cell) => sum + cell.boundBiomass, 0);
    if (mass !== undefined && !Number.isFinite(mass)) throw new Error("Missing frame bound stock");
    const extinct = c.result.stop === "extinction" && c.result.ticks <= tick;
    const observed = mass === undefined ? null : stockReturn(mass);
    return { tick, return: extinct ? -1 : observed };
  });
  const materialError = c.result.maxMaterialResidualPercent;
  const workError = c.result.maxEnergyResidualPercent;
  if (materialError === null || workError === null || !Number.isFinite(materialError + workError))
    throw new Error("Missing accounting residuals");
  const l = c.result.final.ledger;
  const returnError = Math.max(
    1e-9,
    ((materialError / 100) * (l.initialMaterial + l.supplied)) / g.initialBiomass
  );
  return {
    label: c.label,
    lambda: c.lambda,
    empty: c.empty,
    ticks: c.result.ticks,
    stop: c.result.stop,
    wallMs: c.result.wallMs,
    endpointMeasured: c.result.completed || c.result.stop === "extinction",
    accounted: materialError <= 1e-5 && workError <= 1e-5,
    return: stockReturn(g.livingBiomass),
    returnError,
    transient,
    maxMaterialResidualPercent: materialError,
    maxEnergyResidualPercent: workError,
    ...g,
  };
}

type MeasuredCase = ReturnType<typeof measuredCase>;
export function reciprocalSquare(cases: MeasuredCase[]) {
  if (cases.length !== 4 || new Set(cases.map((c) => c.label)).size !== 4)
    throw new Error("Mutation square requires all four distinct genotypes");
  const byLabel = new Map(cases.map((c) => [c.label, c]));
  const differences = (
    [
      ["G00", "G10"],
      ["G00", "G01"],
      ["G11", "G10"],
      ["G11", "G01"],
    ] as const
  ).map(([a, b]) => {
    const left = byLabel.get(a)!,
      right = byLabel.get(b)!;
    const difference = left.return - right.return;
    const allowance = left.returnError + right.returnError;
    return { a, b, difference, allowance, resolvedPositive: difference > allowance };
  });
  const complete = cases.every((c) => c.endpointMeasured && c.accounted);
  return {
    complete,
    differences,
    passed: complete && differences.every((d) => d.resolvedPositive),
  };
}

export function panelReport(cases: BindingCase[]) {
  if (cases.length !== 12) throw new Error("Registered panel requires twelve cases");
  const measured = cases.map(measuredCase);
  const high = reciprocalSquare(measured.filter((c) => c.lambda === 3 && !c.empty));
  const low = reciprocalSquare(measured.filter((c) => c.lambda === 0.25 && !c.empty));
  const controls = measured.filter((c) => c.empty);
  reciprocalSquare(controls); // Validate the four empty-control labels as well.
  const paidAccess = measured
    .filter((c) => c.lambda === 3 && !c.empty)
    .every((c) => {
      const control = controls.find((other) => other.label === c.label)!;
      return (
        c.flows.imported > 0 &&
        c.flows.reacted > 0 &&
        c.flows.captured > 0 &&
        c.return > control.return + c.returnError + control.returnError
      );
    });
  const controlsComplete = controls.every((c) => c.endpointMeasured && c.accounted);
  return {
    cases: measured,
    high,
    low,
    paidAccess,
    controlsComplete,
    sharedEligible: high.passed && paidAccess && controlsComplete,
    steepnessAttribution: high.passed && !low.passed && low.complete,
    units:
      "Returns are net living bound mass per initial bound mass; residuals are percentages of supplied plus initial accounts. Error allowance is observed absolute material residual per initial mass, with a 1e-9 return floor per case; accounts must remain within 1e-7 relative tolerance.",
  };
}
