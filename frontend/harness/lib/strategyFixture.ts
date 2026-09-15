import { type EngineWorld } from "../../src/engine/client";
import { type Definition, type Genotype } from "../../src/engine/types";
import { samplingRandom } from "./samplingRandom";
import { assignPopulation } from "./engineFixtures";
import { type Flags, flag, integerFlag } from "./flags";

/** Supply calendar generated independently of organisms, actions and all world RNGs. */
export function strategyFixture(world: EngineWorld, flags: Flags) {
  const lifetime = integerFlag(flags, "lifetime", 100),
    spacing = integerFlag(flags, "spacing", 2),
    ticks = integerFlag(flags, "ticks", 20000);
  if (lifetime < 1 || spacing < 0 || ticks < 1 || ticks > 50000)
    throw new Error("Invalid bounded deposit schedule");
  const { seed, config } = world.command<Definition>("definition"),
    start = world.command<{ tick: number }>("summary").tick;
  const random = samplingRandom(seed ^ 0x9123),
    sites = Array.from({ length: 8 }, () => ({
      x: random() * config.width,
      y: random() * config.height,
    }));
  const wrap = (v: number, size: number) => ((v % size) + size) % size;
  const calendar: {
    tick: number;
    source: { x: number; y: number; radius: number; rate: number; duration: number };
  }[] = [];
  for (let tick = 0; tick < ticks; tick += lifetime)
    for (const site of sites) {
      const angle = random() * 2 * Math.PI;
      if (tick > 0) {
        site.x = wrap(site.x + spacing * Math.cos(angle), config.width);
        site.y = wrap(site.y + spacing * Math.sin(angle), config.height);
      }
      calendar.push({
        tick: start + tick,
        source: {
          ...site,
          radius: 2,
          rate: 0.3,
          duration: Math.min(lifetime, ticks - tick) * config.dt,
        },
      });
    }
  let cursor = 0;
  return {
    description: { lifetimeTicks: lifetime, relocationWorldUnits: spacing, calendar },
    beforeStep: () => {
      const { tick } = world.command<{ tick: number }>("summary");
      while (cursor < calendar.length && calendar[cursor].tick === tick)
        world.command("scheduledSource", { source: calendar[cursor++].source });
    },
    afterStep: () => {
      world.command("retireSources");
    },
  };
}
export function installMotorVariants(world: EngineWorld, flags: Flags) {
  const ancestor = world.command<Genotype>("genotype", { id: 1 }),
    swap = flag(flags, "swap", "false") === "true";
  const variants = [0.5, 2].map((factor) => {
    const genotype = structuredClone(ancestor);
    for (const c of genotype.chromosomes) c.physical[1] = factor - 1;
    return { label: `motor target times ${factor}`, genotype };
  });
  assignPopulation(world, variants, (i) => (i + Number(swap)) % 2);
}
