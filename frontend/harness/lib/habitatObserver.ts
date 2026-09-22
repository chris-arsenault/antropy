import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Engine, type EngineWorld } from "../../src/engine/client";
import {
  type CellState,
  type Definition,
  type Machinery,
  type Summary,
} from "../../src/engine/types";
import { resourceSample, validateAccounts } from "./studyBudget";

interface HabitatCell {
  id: number;
  lineage: number;
  genome: number;
  born: number;
  body: number[];
  chemistry: Machinery;
  weathering: [number, number, number];
  exports: [number, number][];
}
interface TraceGroup {
  lineage: number;
  living: number;
  ledger: Summary["ledger"];
  chemical: CellState["chemicalFlows"];
}
function eligible(c: HabitatCell, group: TraceGroup, d: Definition, tick: number) {
  if (c.genome === 1 || tick - c.born < 1000) return false;
  const terminal = d.chemistry.properties[d.chemistry.decomposition].potential;
  let invested = 0,
    total = 0;
  for (const [s, amount] of c.exports) {
    total += amount;
    const p = d.chemistry.properties[s];
    if (p.impedance >= 2.5 && p.potential <= terminal + 0.05) invested += amount;
  }
  const f = group.ledger.flows;
  const cost = f.maintenance + f.motors + f.learning + f.transport + f.repair;
  return invested >= 0.1 && invested >= total * 0.1 && f.captured > cost && f.constructed > 0;
}
export function habitatObserver(
  engine: Engine,
  definition: Definition,
  directory: string,
  study: string,
  nominate: boolean,
  traced = true
) {
  if (nominate && !traced) throw new Error("Candidate nomination requires lineage tracing");
  const candidate = join(directory, "candidate.json");
  return (world: EngineWorld) => {
    const summary = world.command<Summary>("summary");
    validateAccounts(summary);
    const habitats = world.command<HabitatCell[]>("habitatSample");
    const groups = traced ? world.command<TraceGroup[]>("trace") : [];
    if (nominate && !existsSync(candidate)) {
      const found = habitats
        .sort((a, b) => a.id - b.id)
        .find((c) =>
          eligible(
            c,
            groups.find((g) => g.lineage === c.lineage)!,
            definition,
            summary.tick
          )
        );
      if (found)
        writeFileSync(
          candidate,
          JSON.stringify({
            tick: summary.tick,
            observed: found,
            genotype: world.command("genotype", { id: found.genome }),
            lineage: groups.find((g) => g.lineage === found.lineage),
          })
        );
    }
    return { habitats, groups, resources: resourceSample(engine, directory, study) };
  };
}
