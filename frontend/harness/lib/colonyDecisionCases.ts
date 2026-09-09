import { type ColonyFrame } from "../../src/sim/colonySensors";
import { Input } from "../../src/sim/controller/contract";

export interface DecisionCase {
  category: string;
  detail: string;
  frame: ColonyFrame;
}

function blank(): { -readonly [K in keyof ColonyFrame]: ColonyFrame[K] } {
  return {
    task: 0,
    navigation: new Float32Array(33),
    hunger: 0.8,
    cargo: 0,
    freshAir: new Array<number>(8).fill(0),
    contacts: Array.from({ length: 8 }, () => ({
      open: true,
      food: 0,
      edible: false,
      hungry: false,
      queen: false,
    })),
  };
}

function directionCase(field: string, target: number, gap: number, blocked: boolean): DecisionCase {
  const frame = blank(),
    offsets = [0, 1, 7];
  frame.contacts = frame.contacts.map((c, i) => ({
    ...c,
    open: !blocked || i !== offsets[target],
  }));
  if (field === "air")
    frame.freshAir = frame.freshAir.map((_, i) => 0.5 + Number(i === offsets[target]) * gap);
  else {
    frame.cargo = field === "home" ? 1 : 0;
    frame.navigation[Input.SKY_LIGHT] = 1;
    const center = field === "home" ? Input.NEST_CENTER : Input.FOOD_CENTER;
    frame.navigation[center] = 0.5;
    for (let i = 0; i < 3; i++) frame.navigation[center + 1 + i] = 0.1 + Number(i === target) * gap;
  }
  return {
    category: `${field}-${blocked ? "obstructed" : "open"}`,
    detail: `target=${target},gap=${gap}`,
    frame,
  };
}

function careCase(kind: string, offset: number, cargo: number): DecisionCase {
  const frame = blank();
  frame.cargo = cargo;
  if (kind === "eat" || kind === "eat-before-feed") frame.hunger = 0.5;
  frame.contacts = frame.contacts.map((c, i) => ({
    ...c,
    edible: i === offset && kind === "eat",
    hungry: i === offset && ["feed", "eat-before-feed", "pickup-for-recipient"].includes(kind),
    queen: i === offset && kind === "release",
    food: i === offset && kind === "pickup-for-recipient" ? 0.25 : 0,
  }));
  return { category: kind, detail: `offset=${offset},cargo=${cargo}`, frame };
}

function directionCases(): DecisionCase[] {
  const cases: DecisionCase[] = [];
  for (const field of ["air", "food", "home"])
    for (const target of [0, 1, 2])
      for (const gap of [0, 1e-8, 1e-6, 1e-4, 0.01])
        for (const blocked of [false, true]) cases.push(directionCase(field, target, gap, blocked));
  return cases;
}

export function colonyDecisionCases(): DecisionCase[] {
  const cases = directionCases();
  for (const offset of [0, 1, 2, 3, 4, 5, 6, 7]) {
    cases.push(careCase("eat", offset, 0), careCase("pickup-for-recipient", offset, 0));
    for (const cargo of [1e-8, 0.25, 4])
      for (const kind of ["feed", "release", "eat-before-feed"])
        cases.push(careCase(kind, offset, cargo));
  }
  return cases;
}
