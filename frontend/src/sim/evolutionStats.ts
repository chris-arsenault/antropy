import { type World } from "./types";
import { locomotion, materialCapacity, bodyRadius } from "./body";
import { controller } from "./controller";
import { express } from "./genetics/genotype";

export function evolutionStats(world: World) {
  const values = world.cells.map((c) => ({
    motor: locomotion(c, world.config).power,
    uptake: c.body.transport * world.config.transporterTurnover,
    storage: materialCapacity(c.body, world.config),
    radius: bodyRadius(c, world.config),
    learned: controller.learnedMagnitude(
      express(world.genomes.get(c.genome)!.genome).behavior,
      c.brain
    ),
  }));
  const range = (key: keyof (typeof values)[number]) =>
    values.length
      ? values.reduce((r, v) => ({ min: Math.min(r.min, v[key]), max: Math.max(r.max, v[key]) }), {
          min: values[0][key],
          max: values[0][key],
        })
      : null;
  return {
    motor: range("motor"),
    uptake: range("uptake"),
    storage: range("storage"),
    radius: range("radius"),
    learned: range("learned"),
    meanLearned: values.reduce((s, v) => s + v.learned, 0) / Math.max(1, values.length),
  };
}
