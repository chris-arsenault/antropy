import { createRandomState, nextRandom } from "../../src/sim/random";
import { wrap } from "../../src/sim/geometry";
import { type World, type Source } from "../../src/sim/types";
import { type Flags, flag, integerFlag } from "./flags";

/** A diagnostic supply calendar; never observes an organism or chooses its actions. */
export function strategyFixture(world: World, flags: Flags) {
  const lifetime = integerFlag(flags, "lifetime", 100),
    spacing = integerFlag(flags, "spacing", 2),
    ticks = integerFlag(flags, "ticks", 20000);
  if (lifetime < 1 || spacing < 0) throw new Error("Invalid deposit schedule");
  const rng = createRandomState(world.seed ^ 0x9123),
    random = () => nextRandom(rng);
  const sites = Array.from({ length: 8 }, () => ({
    x: random() * world.config.width,
    y: random() * world.config.height,
  }));
  const calendar: { tick: number; source: Source }[] = [];
  for (let tick = 0; tick < ticks; tick += lifetime) {
    for (const site of sites) {
      const angle = random() * 2 * Math.PI;
      if (tick > 0) {
        site.x = wrap(site.x + spacing * Math.cos(angle), world.config.width);
        site.y = wrap(site.y + spacing * Math.sin(angle), world.config.height);
      }
      const remaining = Math.min(lifetime, ticks - tick) * world.config.dt;
      calendar.push({
        tick,
        source: {
          ...site,
          remaining,
          rate: 0.3,
          radius: 2,
          foodA: remaining * 0.15,
          foodB: remaining * 0.15,
          wait: 0,
        },
      });
    }
  }
  let cursor = 0;
  return {
    description: { lifetimeTicks: lifetime, relocationCells: spacing, calendar },
    beforeStep: () => {
      while (cursor < calendar.length && calendar[cursor].tick === world.tick) {
        const source = { ...calendar[cursor++].source };
        world.sources.push(source);
        world.ledger.supplied += source.foodA + source.foodB;
      }
    },
    afterStep: () => {
      world.sources = world.sources.filter((s) => s.remaining > 0);
    },
  };
}

export function installMotorVariants(world: World, flags: Flags): void {
  const ancestor = world.genomes.get(1)!;
  for (const [i, factor] of [0.5, 2].entries()) {
    const genome = {
      chromosomes: ancestor.genome.chromosomes.map((c) => {
        const physical = c.physical.slice();
        physical[1] = Math.log(factor);
        return { behavior: c.behavior, physical };
      }),
    };
    world.genomes.set(i + 1, { ...ancestor, id: i + 1, genome });
  }
  world.nextGenome = 3;
  const swap = flag(flags, "swap", "false") === "true";
  for (const [i, cell] of world.cells.entries()) {
    cell.genome = ((i + Number(swap)) % 2) + 1;
    world.ancestry.get(cell.id)!.genome = cell.genome;
  }
}
