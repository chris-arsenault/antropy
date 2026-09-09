import { hungryRecipient, occupied, reachableCells } from "./contact";
import { samePoint, stepFrom } from "./geometry";
import { foodAt } from "./resources";
import { cellIndex } from "./grid";
import { chemicalResponse, isWalkable } from "./scent";
import { type Ant, type World } from "./types";
import { chemicalAccessible } from "./terrain";
import { quantizeColonyFrame } from "./controller/colonyObservation";
import { energyCapacity } from "./adultBody";

export interface LocalContact {
  readonly open: boolean;
  readonly food: number;
  readonly edible: boolean;
  readonly hungry: boolean;
  readonly queen: boolean;
}

export interface ColonyFrame {
  readonly task: number;
  readonly navigation: Float32Array;
  readonly contacts: readonly LocalContact[];
  readonly hunger: number;
  readonly cargo: number;
  readonly freshAir: readonly number[];
}

export function senseColony(world: World, ant: Ant): ColonyFrame {
  const contacts = Array.from({ length: 8 }, (_, offset) => {
    const heading = ant.heading + offset;
    const point = stepFrom(ant, heading);
    const reach = reachableCells(world, ant, heading);
    return {
      open: isWalkable(world.grid, point.x, point.y) && !occupied(world, point, ant),
      food: foodAt(world, point.x, point.y),
      edible: reach.some((cell) => foodAt(world, cell.x, cell.y) > 0),
      hungry: reach.some((cell) => Boolean(hungryRecipient(world, cell))),
      queen: world.queen.alive && reach.some((cell) => samePoint(world.queen, cell)),
    };
  });
  return quantizeColonyFrame({
    task: ant.task,
    navigation: ant.lastInputs,
    contacts,
    hunger: ant.energy / energyCapacity(world, ant),
    cargo: ant.cargo,
    freshAir: Array.from({ length: 8 }, (_, offset) => {
      const point = stepFrom(ant, ant.heading + offset);
      return chemicalAccessible(
        world.grid,
        world.config.environment.chemicalSensing,
        point.x,
        point.y
      )
        ? chemicalResponse(world.freshAir.values[cellIndex(world.grid, point.x, point.y)])
        : 0;
    }),
  });
}
