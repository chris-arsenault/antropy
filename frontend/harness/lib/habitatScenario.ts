import { type Engine } from "../../src/engine/client";
import { type Genotype } from "../../src/engine/types";
import { chemicalContext, coordinate, enzymeBetween } from "./chemicalGenotypes";
import { frozen, install, pulse } from "./engineFixtures";
import { type QuickScenario } from "./quickScenario";

function genome(
  engine: Engine,
  idle: boolean,
  exportOff: boolean,
  handle: number,
  byproduct: boolean
): Genotype {
  const g = chemicalContext(engine).genotype;
  const emitted = byproduct ? 245 : 15;
  const baseline = byproduct ? 240 : 0;
  const depositProduct = idle ? baseline : emitted;
  const exported = idle && byproduct ? 240 : emitted;
  const behavior = engine.command<Genotype["chromosomes"][number]["behavior"]>(
    "diagnosticController",
    { handle, logits: [0, 0, 2, 0, -1, 2, 2, exportOff ? 0 : -2, -2] }
  );
  for (const ch of g.chromosomes) {
    ch.behavior = behavior;
    ch.chemistry.membrane = coordinate(240);
    ch.chemistry.receptors = Array.from({ length: 4 }, () => coordinate(0));
    ch.chemistry.enzymes = [240, depositProduct, 240, 240].map((species) => {
      const target = coordinate(species);
      return enzymeBetween(coordinate(0), target);
    });
    ch.chemistry.transporters = [0, 0, exported, 240].map(coordinate);
  }
  return g;
}

export function habitatScenario(name: string, contest = false): QuickScenario {
  const mild = name.includes("mild"),
    byproduct = name.startsWith("byproduct"),
    feedback = !name.includes("feedback-off"),
    exportOff = name.includes("export-off"),
    centers = contest ? [16, 48] : [6];
  return {
    name,
    hypothesis:
      "Paid production changes local weathering and resource access; compare total funded return with production absent and weathering absent.",
    specification: {
      registration: "ENVIRONMENTAL-ECOLOGY-PLAN.md",
      finiteSourcePerPatch: 12,
      mutation: false,
      learning: false,
      growth: true,
      feedback,
      mild,
      exportOff,
      deposit: byproduct ? 245 : 15,
    },
    target: { x: centers[0], y: centers[0], radius: 2 },
    create(engine, seed, swap) {
      const world = engine.create(seed, {
        ...frozen,
        width: contest ? 64 : 24,
        height: contest ? 64 : 24,
        mesh: 2,
        founders: centers.length,
        sourceCount: 0,
        habitatFeedback: feedback,
        ...(mild ? { weatheringRate: 0 } : {}),
      });
      try {
        for (const center of centers) pulse(world, [[0, 12]], [center, center], 2);
        const variants = [
          {
            label: "producer",
            genotype: genome(engine, false, exportOff, world.handle, byproduct),
          },
        ];
        if (contest)
          variants.push({
            label: "idle",
            genotype: genome(engine, true, false, world.handle, byproduct),
          });
        install(
          world,
          variants,
          centers.map((center, i) => ({
            cell: i + 1,
            variant: contest ? (i + Number(swap)) % 2 : 0,
            x: center,
            y: center,
            heading: 0,
          }))
        );
        return world;
      } catch (error) {
        world.dispose();
        throw error;
      }
    },
  };
}
