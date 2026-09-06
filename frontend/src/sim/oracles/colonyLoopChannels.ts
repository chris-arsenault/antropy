import { Input } from "../controller/contract";

export interface ScentChannels {
  readonly ahead: number;
  readonly downAhead: number;
  readonly upAhead: number;
  readonly left: number;
  readonly right: number;
  readonly down: number;
  readonly up: number;
  readonly center: number;
  readonly leftChange: number;
  readonly rightChange: number;
  readonly downChange: number;
  readonly upChange: number;
  readonly centerChange: number;
  readonly downLeft: number;
  readonly downRight: number;
  readonly upLeft: number;
  readonly upRight: number;
}

export const FOOD_CHANNELS: ScentChannels = {
  ahead: Input.FOOD_SCENT_AHEAD,
  downAhead: Input.FOOD_SCENT_DOWN_AHEAD,
  upAhead: Input.FOOD_SCENT_UP_AHEAD,
  left: Input.FOOD_SCENT_LEFT,
  right: Input.FOOD_SCENT_RIGHT,
  down: Input.FOOD_SCENT_DOWN,
  up: Input.FOOD_SCENT_UP,
  center: Input.FOOD_SCENT_CENTER,
  leftChange: Input.FOOD_SCENT_LEFT_CHANGE,
  rightChange: Input.FOOD_SCENT_RIGHT_CHANGE,
  downChange: Input.FOOD_SCENT_DOWN_CHANGE,
  upChange: Input.FOOD_SCENT_UP_CHANGE,
  centerChange: Input.FOOD_SCENT_CENTER_CHANGE,
  downLeft: Input.FOOD_SCENT_DOWN_LEFT,
  downRight: Input.FOOD_SCENT_DOWN_RIGHT,
  upLeft: Input.FOOD_SCENT_UP_LEFT,
  upRight: Input.FOOD_SCENT_UP_RIGHT,
};

export const NEST_CHANNELS: ScentChannels = {
  ahead: Input.NEST_SCENT_AHEAD,
  downAhead: Input.NEST_SCENT_DOWN_AHEAD,
  upAhead: Input.NEST_SCENT_UP_AHEAD,
  left: Input.NEST_SCENT_LEFT,
  right: Input.NEST_SCENT_RIGHT,
  down: Input.NEST_SCENT_DOWN,
  up: Input.NEST_SCENT_UP,
  center: Input.NEST_SCENT_CENTER,
  leftChange: Input.NEST_SCENT_LEFT_CHANGE,
  rightChange: Input.NEST_SCENT_RIGHT_CHANGE,
  downChange: Input.NEST_SCENT_DOWN_CHANGE,
  upChange: Input.NEST_SCENT_UP_CHANGE,
  centerChange: Input.NEST_SCENT_CENTER_CHANGE,
  downLeft: Input.NEST_SCENT_DOWN_LEFT,
  downRight: Input.NEST_SCENT_DOWN_RIGHT,
  upLeft: Input.NEST_SCENT_UP_LEFT,
  upRight: Input.NEST_SCENT_UP_RIGHT,
};

export const COLONY_CHANNELS: ScentChannels = {
  ahead: Input.COLONY_SCENT_AHEAD,
  downAhead: Input.COLONY_SCENT_DOWN_AHEAD,
  upAhead: Input.COLONY_SCENT_UP_AHEAD,
  left: Input.COLONY_SCENT_LEFT,
  right: Input.COLONY_SCENT_RIGHT,
  down: Input.COLONY_SCENT_DOWN,
  up: Input.COLONY_SCENT_UP,
  center: Input.COLONY_SCENT_CENTER,
  leftChange: Input.COLONY_SCENT_LEFT_CHANGE,
  rightChange: Input.COLONY_SCENT_RIGHT_CHANGE,
  downChange: Input.COLONY_SCENT_DOWN_CHANGE,
  upChange: Input.COLONY_SCENT_UP_CHANGE,
  centerChange: Input.COLONY_SCENT_CENTER_CHANGE,
  downLeft: Input.COLONY_SCENT_DOWN_LEFT,
  downRight: Input.COLONY_SCENT_DOWN_RIGHT,
  upLeft: Input.COLONY_SCENT_UP_LEFT,
  upRight: Input.COLONY_SCENT_UP_RIGHT,
};

export const PHEROMONE_A_CHANNELS: ScentChannels = {
  ahead: Input.PHEROMONE_A_AHEAD,
  downAhead: Input.PHEROMONE_A_DOWN_AHEAD,
  upAhead: Input.PHEROMONE_A_UP_AHEAD,
  left: Input.PHEROMONE_A_LEFT,
  right: Input.PHEROMONE_A_RIGHT,
  down: Input.PHEROMONE_A_DOWN,
  up: Input.PHEROMONE_A_UP,
  center: Input.PHEROMONE_A_CENTER,
  leftChange: Input.PHEROMONE_A_LEFT_CHANGE,
  rightChange: Input.PHEROMONE_A_RIGHT_CHANGE,
  downChange: Input.PHEROMONE_A_DOWN_CHANGE,
  upChange: Input.PHEROMONE_A_UP_CHANGE,
  centerChange: Input.PHEROMONE_A_CENTER_CHANGE,
  downLeft: Input.PHEROMONE_A_DOWN_LEFT,
  downRight: Input.PHEROMONE_A_DOWN_RIGHT,
  upLeft: Input.PHEROMONE_A_UP_LEFT,
  upRight: Input.PHEROMONE_A_UP_RIGHT,
};

export type ChannelName = keyof ScentChannels;
export type GoalKind = "entranceTrail" | "nest" | "wildFood" | "storedFood";
