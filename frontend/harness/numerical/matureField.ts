/** Static culling estimates over borrowed planes; no physical state is changed. */
import { type EngineWorld } from "../../src/engine/client";

interface Property {
  potential: number;
  impedance: number;
  stress: number;
  interaction: number[];
}
const floors = [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4, 1e-3];
const popcount = (value: bigint) => {
  let count = 0;
  for (; value; value &= value - 1n) count++;
  return count;
};

function support(mask: BigUint64Array, nx: number, ny: number) {
  let groups = 0,
    candidates = 0;
  for (let n = 0; n < mask.length; n++) {
    const x = n % nx,
      y = Math.floor(n / nx);
    const neighbors = [
      y * nx + ((x + 1) % nx),
      y * nx + ((x + nx - 1) % nx),
      ((y + 1) % ny) * nx + x,
      ((y + ny - 1) % ny) * nx + x,
    ];
    groups += popcount(mask[n]);
    candidates += popcount(neighbors.reduce((v, i) => v | mask[i], mask[n]));
  }
  return { groups, candidates };
}

function stateFor(floor: number, nodes: number) {
  return {
    floor,
    masks: new BigUint64Array(nodes),
    removed: 0,
    reference: 0,
    entries: 0,
    local: Array.from({ length: 5 }, () => new Float64Array(nodes)),
  };
}

function accumulate(
  states: ReturnType<typeof stateFor>[],
  n: number,
  concentration: number,
  area: number,
  bit: bigint,
  p: Property
) {
  for (const state of states) {
    if (concentration >= state.floor) {
      state.masks[n] |= bit;
      continue;
    }
    state.entries++;
    state.removed += concentration * area;
    state.reference += concentration * area * p.potential;
    const weights = [1, p.impedance, p.stress, ...p.interaction.map(Math.abs)];
    weights.forEach((weight, k) => (state.local[k][n] += concentration * weight));
  }
}

export function fieldCosts(world: EngineWorld, properties: Property[], area: number) {
  const { nx, ny } = world.render(4, 0);
  const states = floors.map((floor) => stateFor(floor, nx * ny));
  const occupied = new BigUint64Array(nx * ny);
  const species = [];
  let total = 0;
  for (let s = 0; s < 256; s++) {
    const plane = world.render(4, s).field;
    const p = properties[s],
      bit = 1n << BigInt(Math.floor(s / 4));
    let amount = 0,
      peak = 0;
    for (let n = 0; n < plane.length; n++) {
      const concentration = plane[n];
      if (concentration <= 0) continue;
      occupied[n] |= bit;
      amount += concentration * area;
      peak = Math.max(peak, concentration);
      accumulate(states, n, concentration, area, bit, p);
    }
    total += amount;
    species.push({ id: s, amount, peak });
  }
  return {
    nx,
    ny,
    total,
    baseline: support(occupied, nx, ny),
    species: species.sort((a, b) => b.amount - a.amount),
    thresholds: states.map(({ masks, local, ...state }) => ({
      ...state,
      ...support(masks, nx, ny),
      localMaximumRemoved: local.map((row) => row.reduce((a, b) => Math.max(a, b), 0)),
    })),
  };
}
