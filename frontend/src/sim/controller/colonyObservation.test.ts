import { describe, expect, it } from "vitest";
import { type ColonyFrame } from "../colonySensors";
import { programmedColony } from "../policies/colony";
import { chemicalResponse } from "../scent";
import { colonyMotor, encodeColonyFrame } from "./colonyEncoding";
import { quantizeColonyFrame } from "./colonyObservation";
import { Input } from "./contract";

function frame(): ColonyFrame {
  return {
    task: 0,
    navigation: new Float32Array(33),
    hunger: 0.8,
    cargo: 0,
    freshAir: [chemicalResponse(3000), chemicalResponse(3000.000244140625), 0, 0, 0, 0, 0, 0],
    contacts: Array.from({ length: 8 }, (_, i) => ({
      open: i < 2,
      food: 0,
      edible: false,
      hungry: false,
      queen: false,
    })),
  };
}

describe("matched float32 colony observations", () => {
  it("gives the same programmed action to the formerly aliased air samples", () => {
    const a = frame();
    const b = { ...a, freshAir: [a.freshAir[1], a.freshAir[0], ...a.freshAir.slice(2)] };
    expect(a.freshAir[0]).not.toBe(a.freshAir[1]);
    expect(encodeColonyFrame(a)).toEqual(encodeColonyFrame(b));
    expect(colonyMotor(programmedColony(a))).toBe(3);
    expect(programmedColony(a)).toEqual(programmedColony(b));
  });

  it("quantizes before normalization, is idempotent and leaves physical quantities untouched", () => {
    const raw = { ...frame(), hunger: 0.7123456789, cargo: 0.123456789 };
    const before = structuredClone(raw),
      observed = quantizeColonyFrame(raw);
    expect(observed).toEqual(quantizeColonyFrame(observed));
    expect(raw).toEqual(before);
    expect(observed.cargo).not.toBe(raw.cargo);
    expect(observed.navigation[Input.CARRYING]).toBe(1);
    expect(encodeColonyFrame(raw)).toEqual(encodeColonyFrame(observed));
  });

  it("uses float32 thresholds for hunger and gives eating priority over feeding", () => {
    const hungry = {
      ...frame(),
      hunger: 0.69,
      cargo: 1,
      contacts: frame().contacts.map((c) => ({ ...c, hungry: true })),
    };
    expect(colonyMotor(programmedColony(hungry))).toBe(5);
    expect(colonyMotor(programmedColony({ ...hungry, hunger: 0.7 - 1e-10 }))).toBe(6);
    expect(colonyMotor(programmedColony({ ...hungry, hunger: 0.7 + 1e-10 }))).toBe(6);
  });

  it("excludes an obstructed stronger sample and senses tiny positive crops as carrying", () => {
    const raw = {
      ...frame(),
      freshAir: [0.4, 0.9, 0, 0, 0, 0, 0, 0],
      contacts: frame().contacts.map((c, i) => ({ ...c, open: i === 0 })),
    };
    expect(colonyMotor(programmedColony(raw))).toBe(3);
    expect(encodeColonyFrame({ ...raw, cargo: 1e-20 })[Input.CARRYING]).toBe(1);
    expect(encodeColonyFrame({ ...raw, cargo: 0 })[Input.CARRYING]).toBe(0);
  });
});
