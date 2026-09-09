import { isInterior } from "../../src/sim/terrain";
import { cellIndex } from "../../src/sim/grid";
import { type ColonyFrame } from "../../src/sim/colonySensors";
import { type Action } from "../../src/sim/controller/contract";
import { colonyMotor } from "../../src/sim/controller/colonyEncoding";
import { type Ant, type World } from "../../src/sim/types";

function counters(id: number) {
  return {
    id,
    ticks: 0,
    moves: 0,
    turns: 0,
    surfaceTicks: 0,
    longTurnTicks: 0,
    hungryTurnTicks: 0,
    loadedTurnTicks: 0,
    recipientTurnTicks: 0,
    blockedTurnTicks: 0,
    externalPickups: 0,
    harvestQuantity: 0,
    depositQuantity: 0,
    fedEnergy: 0,
  };
}

interface TurnEpisode {
  id: number;
  start: number;
  length: number;
  x: number;
  y: number;
  minReserve: number;
  maxReserve: number;
  loadedTicks: number;
  hungryRecipientTicks: number;
  fullyBlockedTicks: number;
  startFrame: ColonyFrame;
}

/** Measurements never enter a controller. Finish each pending action before observing the next. */
export class ColonyActivity {
  private workers = new Map<number, ReturnType<typeof counters>>();
  private readonly turns = new Map<number, TurnEpisode>();
  private readonly longest = new Map<number, TurnEpisode>();
  private pending: {
    ant: Ant;
    x: number;
    y: number;
    harvested: number;
    deposited: number;
    fed: number;
  } | null = null;

  private worker(id: number) {
    let worker = this.workers.get(id);
    if (!worker) {
      worker = counters(id);
      this.workers.set(id, worker);
    }
    return worker;
  }

  finishAction(world: World): void {
    const prior = this.pending;
    if (!prior) return;
    const worker = this.worker(prior.ant.id);
    worker.moves += Number(prior.x !== prior.ant.x || prior.y !== prior.ant.y);
    const harvested = world.economy.harvested - prior.harvested;
    worker.externalPickups += Number(harvested > 0);
    worker.harvestQuantity += harvested / world.config.foodEnergyDensity;
    worker.depositQuantity +=
      (world.metrics.foodDeposited - prior.deposited) * world.config.initialFoodQuantity;
    worker.fedEnergy += world.economy.queenFed + world.economy.broodFed - prior.fed;
    this.pending = null;
  }

  observe(world: World, ant: Ant, frame: ColonyFrame, action: Action): void {
    this.finishAction(world);
    const worker = this.worker(ant.id);
    worker.ticks++;
    worker.surfaceTicks += Number(!isInterior(world.grid, cellIndex(world.grid, ant.x, ant.y)));
    if ([1, 2].includes(colonyMotor(action))) this.observeTurn(world.tick, ant, frame);
    else this.turns.delete(ant.id);
    this.pending = {
      ant,
      x: ant.x,
      y: ant.y,
      harvested: world.economy.harvested,
      deposited: world.metrics.foodDeposited,
      fed: world.economy.queenFed + world.economy.broodFed,
    };
  }

  private observeTurn(tick: number, ant: Ant, frame: ColonyFrame): void {
    const worker = this.worker(ant.id);
    worker.turns++;
    const episode = this.turns.get(ant.id) ?? {
      id: ant.id,
      start: tick,
      length: 0,
      x: ant.x,
      y: ant.y,
      minReserve: frame.hunger,
      maxReserve: frame.hunger,
      loadedTicks: 0,
      hungryRecipientTicks: 0,
      fullyBlockedTicks: 0,
      startFrame: structuredClone(frame),
    };
    episode.length++;
    episode.minReserve = Math.min(episode.minReserve, frame.hunger);
    episode.maxReserve = Math.max(episode.maxReserve, frame.hunger);
    const loaded = Number(frame.cargo > 0);
    const recipient = Number(frame.contacts.some((contact) => contact.hungry));
    const blocked = Number(frame.contacts.every((contact) => !contact.open));
    episode.loadedTicks += loaded;
    episode.hungryRecipientTicks += recipient;
    episode.fullyBlockedTicks += blocked;
    this.turns.set(ant.id, episode);
    if (episode.length < 100) return;
    worker.longTurnTicks++;
    worker.hungryTurnTicks += Number(frame.hunger < Math.fround(0.7));
    worker.loadedTurnTicks += loaded;
    worker.recipientTurnTicks += recipient;
    worker.blockedTurnTicks += blocked;
    if (episode.length > (this.longest.get(ant.id)?.length ?? 0)) this.longest.set(ant.id, episode);
  }

  window(tick: number) {
    const workers = [...this.workers.values()];
    this.workers = new Map();
    return {
      tick,
      workers,
      activeForagers: workers.filter((worker) => worker.externalPickups > 0).length,
      depositors: workers.filter((worker) => worker.depositQuantity > 0).length,
      feeders: workers.filter((worker) => worker.fedEnergy > 0).length,
      workerTicks: workers.reduce((total, worker) => total + worker.ticks, 0),
      longTurnTicks: workers.reduce((total, worker) => total + worker.longTurnTicks, 0),
    };
  }

  episodes() {
    return [...this.longest.values()]
      .sort((a, b) => b.length - a.length)
      .slice(0, 12)
      .map((episode) => ({
        ...episode,
        startFrame: {
          ...episode.startFrame,
          navigation: [...episode.startFrame.navigation],
        },
      }));
  }
}
