import { type World, type Source } from "./types";
import { nextRandom } from "./random";
import { wrap, delta } from "./geometry";
import { deposit } from "./fields";
import { foodEpoch } from "./foodEpochs";
import { foodZone, foodZoneX } from "./foodZones";

/** Composition by position, by calendar, or the drawn mixture. */
function composition(world: World, mixed: number, x: number): number {
  const c = world.config;
  if (c.foodZones) return foodZone(c.foodZones, x, c.width).share;
  if (c.foodEpochs) return foodEpoch(c.foodEpochs, world.tick).share;
  return mixed;
}
/**
 * Zoned worlds give every band equal supply: deposit slot i always lands in band i mod N, at the
 * drawn offset within that band. Unzoned worlds keep the drawn position unchanged.
 */
function zoned(world: World, x: number, slot: number): number {
  const c = world.config;
  if (!c.foodZones) return x;
  return foodZoneX(c.foodZones, x, c.width, slot);
}
export function newDeposit(world: World, slot = 0): Source {
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
  const drawn = clustered
    ? wrap(center.x + (random() - 0.5) * c.width * 0.4, c.width)
    : random() * c.width;
  const y = clustered
    ? wrap(center.y + (random() - 0.5) * c.height * 0.4, c.height)
    : random() * c.height;
  return localDeposit(world, slot, { x: drawn, y, remaining, rate, mixed }, random);
}
function localDeposit(
  world: World,
  slot: number,
  drawn: { x: number; y: number; remaining: number; rate: number; mixed: number },
  random: () => number
): Source {
  const c = world.config;
  const { remaining, rate, mixed, y } = drawn;
  const habitat = world.habitats[slot] ?? {
    x: drawn.x,
    y,
    radius: c.sourceRadius * (0.35 + random()),
    share: mixed,
    richness: 1,
  };
  const radius = habitat.radius;
  const x = world.habitats[slot] ? habitat.x : zoned(world, habitat.x, slot);
  const share = composition(world, habitat.share, x);
  const localRate = rate * habitat.richness;
  return {
    x,
    y: habitat.y,
    radius,
    remaining,
    rate: localRate,
    foodA: remaining * localRate * share,
    foodB: remaining * localRate * (1 - share),
    wait: 0,
  };
}
/** Move material from finite source stock into its local field before founders arrive. */
export function primeDeposits(world: World): void {
  if (world.config.resourceLayout !== "localized") return;
  for (const source of world.sources) {
    const fraction = world.config.sourcePriming;
    leak(world, source, source.foodA * fraction, world.nutrient);
    leak(world, source, source.foodB * fraction, world.nutrientB);
    source.foodA *= 1 - fraction;
    source.foodB *= 1 - fraction;
  }
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
function advanceDeposit(world: World, source: Source, slot: number): void {
  const c = world.config;
  if (source.remaining <= 0) {
    source.wait -= c.dt;
    if (source.wait > 0) return;
    Object.assign(source, newDeposit(world, slot));
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
  for (const [slot, source] of world.sources.entries()) advanceDeposit(world, source, slot);
}
