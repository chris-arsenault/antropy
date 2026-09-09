import { describe, expect, it } from "vitest";
import { scoreColonyOutcome, type ColonyOutcomePoint } from "./colonyOutcome";

function trajectory(): ColonyOutcomePoint[] {
  return Array.from({ length: 25 }, (_, index) => ({
    taskOverrides: 0,
    tick: index * 2000,
    queenAlive: true,
    queenReserve: 20,
    workers: 4,
    founders: index < 8 ? 4 : 0,
    births: index,
    workerReserve: 20,
    broodReserve: 2,
    broodInvestment: 4,
    queenFed: index * 4,
    broodFed: index * 6,
    storedEnergy: 10,
    residual: 0,
  }));
}

describe("colony outcome objective", () => {
  it("accepts continued queen care and replacement without an eight-worker target", () => {
    expect(scoreColonyOutcome(trajectory(), 16000).viable).toBe(true);
  });
  it("rejects queen death even when workers and accumulated births are abundant", () => {
    const alive = trajectory(),
      dead = trajectory();
    Object.assign(dead.at(-1)!, {
      queenAlive: false,
      queenReserve: 0,
      workers: 100,
      births: 1000,
      workerReserve: 1000,
    });
    expect(scoreColonyOutcome(dead, 16000).viable).toBe(false);
    expect(scoreColonyOutcome(dead, 16000).score).toBeLessThan(
      scoreColonyOutcome(alive.slice(0, 6), 16000).score
    );
  });
  it("cannot certify an assisted start or credit transfers before actor control", () => {
    const reference = trajectory();
    const assisted = reference.map((point) => ({ ...point, tick: point.tick + 4000 }));
    expect(scoreColonyOutcome(assisted, 16000).viable).toBe(false);
    const inherited = assisted.map((point) => ({
      ...point,
      queenFed: point.queenFed + 100,
      broodFed: point.broodFed + 100,
      births: point.births + 100,
    }));
    expect(scoreColonyOutcome(inherited, 16000).score).toBe(
      scoreColonyOutcome(assisted, 16000).score
    );
  });
  it("gives no credit for arbitrary stockpiles or repeated collection and dropping", () => {
    const reference = trajectory();
    const piles = reference.map((point) => ({
      ...point,
      storedEnergy: 1e9,
      pickups: 1e9,
      deposits: 1e9,
      movement: 1e9,
    }));
    expect(scoreColonyOutcome(piles, 16000)).toMatchObject({
      score: scoreColonyOutcome(reference, 16000).score,
    });
  });
});

describe("outcome learning credit", () => {
  it("preserves early biological progress after extinction without calling it survival", () => {
    const reference = trajectory()
      .slice(0, 11)
      .map((point) => ({
        ...point,
        births: 0,
        queenFed: 0,
        broodFed: 0,
        workerReserve: 0,
        broodReserve: 0,
        broodInvestment: 0,
      }));
    Object.assign(reference.at(-1)!, { queenAlive: false, queenReserve: 0, workers: 0 });
    const nourished = reference.map((point, index) => ({
      ...point,
      workerReserve: index < 5 ? 20 : 0,
    }));
    const result = scoreColonyOutcome(nourished, 16000);
    expect(result.viable).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(scoreColonyOutcome(reference, 16000).score);
  });
  it("rejects surviving founders, stopped feeding, stopped recruitment and broken conservation", () => {
    for (const replacement of [
      { founders: 1 },
      { queenFed: 0 },
      { births: 0 },
      { broodFed: 0 },
      { residual: 1 },
      { taskOverrides: 1 },
      { queenReserve: -1 },
      { workerReserve: -1 },
      { broodInvestment: -1 },
    ]) {
      const series = trajectory().map((point) => ({ ...point, ...replacement }));
      expect(scoreColonyOutcome(series, 16000).viable).toBe(false);
    }
  });
});
