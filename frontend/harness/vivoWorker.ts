import { foundColony } from "../src/sim/colony";
import { setRuntimeSeedBase } from "../src/sim/controller/rnn";
import { createWorld, stepWorld } from "../src/sim/world";

/**
 * In-vivo fitness worker: reads {vector, worldSeed, ticks} JSON on stdin,
 * runs one real seeded colony with the candidate vector as the seed base
 * (normal seed() noise on top — robustness by construction), and prints
 * the fitness components as JSON. One process per evaluation; the parent
 * pool schedules them across cores.
 */
interface Job {
  vector: number[];
  worldSeed: number;
  ticks: number;
}

function fitnessOf(job: Job): Record<string, number> {
  setRuntimeSeedBase(job.vector);
  const world = createWorld(job.worldSeed);
  world.config.autoContinue = false; // measure the colony, not the safety net
  const colony = foundColony(world);
  let workerTicks = 0;
  for (let t = 0; t < job.ticks; t++) {
    stepWorld(world);
    workerTicks += world.ants.length;
  }
  let merit = 0;
  for (const credit of colony.patrilineDeliveries.values()) {
    merit += credit;
  }
  const workerDays = workerTicks / 1000;
  const eggSurvival = world.eggsLaid === 0 ? 0 : 1 - world.eggsPerished / world.eggsLaid;
  // The delivery loop's signature: sustained population, credited
  // deliveries, and a crop that stays provisioned.
  const fitness =
    workerDays + 0.03 * merit + 2 * Math.min(4, colony.stockpile) + 5 * eggSurvival;
  return {
    fitness,
    workerDays,
    merit,
    stockpile: colony.stockpile,
    ants: world.ants.length,
    eggSurvival,
  };
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const job = JSON.parse(input) as Job;
  process.stdout.write(JSON.stringify(fitnessOf(job)));
});
