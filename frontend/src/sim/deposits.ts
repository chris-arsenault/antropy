import { type World, type Source } from "./types";
import { nextRandom } from "./random";
import { wrap, delta } from "./geometry";
import { deposit } from "./fields";
import { foodEpoch } from "./foodEpochs";

export function newDeposit(world: World): Source {
  const c = world.config,
    rng = world.environmentRng;
  const random = () => nextRandom(rng);
  const center = world.patchCenters[Math.floor(random() * world.patchCenters.length)];
  const clustered = random() < 0.7;
  const duration = { persistent: 4, transient: 0.5, patchy: 0.5 + 4 * random() ** 2 }[c.regime];
  const remaining = c.sourceLifetime * duration * (0.5 + random());
  const rate = (c.sourceRate * (0.4 + 1.2 * random())) / Math.sqrt(duration);
  // Keep the same environment draws so composition cannot reschedule or relocate deposits.
  const mixed = random() < 0.5 ? 0.05 + 0.2 * random() : 0.75 + 0.2 * random();
  const share = c.foodEpochs ? foodEpoch(c.foodEpochs, world.tick).share : mixed;
  return {
    x: clustered ? wrap(center.x + (random() - 0.5) * c.width * 0.4, c.width) : random() * c.width,
    y: clustered
      ? wrap(center.y + (random() - 0.5) * c.height * 0.4, c.height)
      : random() * c.height,
    radius: c.sourceRadius * (0.35 + random()),
    remaining,
    rate,
    foodA: remaining * rate * share,
    foodB: remaining * rate * (1 - share),
    wait: 0,
  };
}
function leak(world: World, source: Source, amount: number, field: Float64Array): void {
  const c = world.config,
    reach = Math.ceil(source.radius * 2);
  const entries: [number, number][] = [];
  let total = 0;
  for (let dy = -reach; dy <= reach; dy++)
    for (let dx = -reach; dx <= reach; dx++) {
      const x = wrap(Math.floor(source.x) + dx, c.width),
        y = wrap(Math.floor(source.y) + dy, c.height);
      const d = delta(x - source.x, c.width) ** 2 + delta(y - source.y, c.height) ** 2;
      const weight = Math.exp(-d / (2 * source.radius ** 2));
      entries.push([y * c.width + x, weight]);
      total += weight;
    }
  for (const [i, weight] of entries) field[i] += (amount * weight) / total;
}
function advanceDeposit(world: World, source: Source): void {
  const c = world.config;
  if (source.remaining <= 0) {
    source.wait -= c.dt;
    if (source.wait > 0) return;
    Object.assign(source, newDeposit(world));
    world.ledger.supplied += source.foodA + source.foodB;
  }
  const total = source.foodA + source.foodB;
  const fraction = Math.min(1, (source.rate * c.dt) / Math.max(total, 1e-30));
  leak(world, source, source.foodA * fraction, world.nutrient);
  leak(world, source, source.foodB * fraction, world.nutrientB);
  source.foodA *= 1 - fraction;
  source.foodB *= 1 - fraction;
  source.remaining -= c.dt;
  if (source.remaining <= 0 || source.foodA + source.foodB <= 1e-12) {
    deposit(world.detritus, source, source.foodA + source.foodB, c);
    source.foodA = 0;
    source.foodB = 0;
    source.remaining = 0;
    source.wait = -Math.log(Math.max(1e-12, nextRandom(world.environmentRng))) * c.sourceGap;
  }
}
export function advanceDeposits(world: World): void {
  for (const source of world.sources) advanceDeposit(world, source);
}
