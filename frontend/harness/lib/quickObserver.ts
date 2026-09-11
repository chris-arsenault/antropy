import { type World } from "../../src/sim/types";
import { attachObserver, type FlowChannel } from "../../src/sim/observation";
import { distance } from "../../src/sim/geometry";
import { observe } from "../../src/sim/sensors";
import { locomotion } from "../../src/sim/body";
import { matrixMobility } from "../../src/sim/matrix";
import { type QuickScenario, percent } from "./quickScenario";

const perCell = (value: number, count: number) => (count > 0 ? value / count : null);

export class QuickObserver {
  private flows = new Map<number, Partial<Record<FlowChannel, number>>>();
  private births = new Map<number, number>();
  private divisions = new Map<number, number>();
  private arrivals = new Map<number, number>();
  private firstUptake = new Map<number, number>();
  private initial: Map<number, number>;
  private lineages: Map<number, number>;
  private exposure = new Map<number, { seconds: number; damage: number; slowed: number }>();
  private detach: () => void;
  constructor(
    private world: World,
    private scenario: QuickScenario
  ) {
    this.initial = new Map(world.cells.map((c) => [c.id, c.genome]));
    this.lineages = new Map(world.cells.map((c) => [c.lineage, c.genome]));
    this.detach = attachObserver(world, {
      flow: (f) => {
        const id = this.lineages.get(f.lineage)!;
        const group = this.flows.get(id) ?? {};
        group[f.channel] = (group[f.channel] ?? 0) + f.amount;
        this.flows.set(id, group);
        if (f.channel === "food_a" && !this.firstUptake.has(f.cell))
          this.firstUptake.set(f.cell, f.tick);
      },
      life: (f) => {
        const id = this.lineages.get(f.lineage)!;
        if (f.kind === "birth") this.births.set(id, (this.births.get(id) ?? 0) + 1);
        if (f.kind === "division") this.divisions.set(id, (this.divisions.get(id) ?? 0) + 1);
      },
    });
  }
  beforeStep(): void {
    for (const c of this.world.cells) {
      const id = this.lineages.get(c.lineage)!;
      const e = this.exposure.get(id) ?? { seconds: 0, damage: 0, slowed: 0 };
      e.seconds += this.world.config.dt;
      e.damage += c.damage * this.world.config.dt;
      e.slowed += Number(matrixMobility(this.world, c) <= 0.8) * this.world.config.dt;
      this.exposure.set(id, e);
    }
  }
  afterStep(): void {
    for (const c of this.world.cells)
      if (
        !this.arrivals.has(c.id) &&
        distance(c, this.scenario.target, this.world.config) <= this.scenario.target.radius
      )
        this.arrivals.set(c.id, this.world.tick);
  }
  frame() {
    return {
      tick: this.world.tick,
      cells: this.world.cells.map((c) => ({
        id: c.id,
        genome: c.genome,
        group: this.lineages.get(c.lineage),
        parent: c.parent,
        x: c.x,
        y: c.y,
        heading: c.heading,
        energy: c.energy,
        reserve: c.reserve,
        body: { ...c.body },
        damage: c.damage,
        speedCeiling: locomotion(c, this.world.config).speed,
        matrixMobility: matrixMobility(this.world, c),
        action: { ...c.action },
        inputs: Array.from(c.inputs),
        // Probe a copy: obtaining a trace must not advance the real receptor baseline.
        localInputsNow: Array.from(observe(this.world, structuredClone(c))),
        targetDistance: distance(c, this.scenario.target, this.world.config),
      })),
    };
  }
  result() {
    return [...new Set(this.initial.values())].map((genome) => {
      const founders = [...this.initial].filter(([, g]) => g === genome).map(([id]) => id);
      const flows = this.flows.get(genome) ?? {};
      const a = flows.food_a ?? 0,
        b = flows.food_b ?? 0;
      const exposure = this.exposure.get(genome) ?? { seconds: 0, damage: 0, slowed: 0 };
      return {
        genome,
        initialCells: founders.length,
        living: this.world.cells.filter((c) => this.lineages.get(c.lineage) === genome).length,
        meanDamagePercent: percent(exposure.damage, exposure.seconds),
        slowedOrganismTimePercent: percent(exposure.slowed, exposure.seconds),
        organismSeconds: exposure.seconds,
        offeredFoodACapturedPercent: percent(a, this.scenario.offeredFoodA),
        offeredFoodBCapturedPercent: percent(b, this.scenario.offeredFoodB ?? 0),
        motorPercentAbsorbedEnergy: percent(
          flows.motors ?? 0,
          (a + b) * this.world.config.nutrientEnergy
        ),
        constructedMaterialPerInitialCell: perCell(flows.constructed ?? 0, founders.length),
        birthsPerInitialCell: perCell(this.births.get(genome) ?? 0, founders.length),
        divisionsPerInitialCell: perCell(this.divisions.get(genome) ?? 0, founders.length),
        founderArrivalsPercent: percent(
          founders.filter((id) => this.arrivals.has(id)).length,
          founders.length
        ),
        founderArrivalTicks: founders.map((id) => this.arrivals.get(id) ?? null),
        founderFirstUptakeTicks: founders.map((id) => this.firstUptake.get(id) ?? null),
        flows,
      };
    });
  }
  close(): void {
    this.detach();
  }
}
