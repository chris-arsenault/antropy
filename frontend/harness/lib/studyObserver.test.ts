// @vitest-environment node
import { expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEngine } from "../numerical/engine";
import { type Summary } from "../../src/engine/types";
import { StudyObserver } from "./studyObserver";

function rows(directory: string, name: string): Record<string, unknown>[] {
  return readFileSync(join(directory, `${name}.jsonl`), "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

it("retains descendant births, terminal deaths and division expenses across drains", async () => {
  const engine = await loadEngine(),
    world = engine.diagnostic("nutrition"),
    directory = mkdtempSync(join(tmpdir(), "antropy-study-life-"));
  const frame = world.command<{ cells: { cell: { id: number; body: number[] } }[] }>("assayFrame");
  world.command("intervene", {
    cell: 1,
    body: frame.cells[0].cell.body.map((q) => q * 2),
    energy: 1,
  });
  const observer = new StudyObserver(world, directory);
  try {
    for (let i = 0; i < 16; i++) {
      world.step();
      if (i % 4 === 3) observer.flush();
    }
    const summary = world.command<Summary>("summary");
    expect(summary.ledger.divisions).toBeGreaterThan(0);
    const living = world.command<{ cells: { id: number }[] }>("frame").cells;
    for (const cell of living) world.command("intervene", { cell: cell.id, kill: true });
    observer.close();
    const life = rows(directory, "life"),
      flows = rows(directory, "flows");
    expect(life.filter((r) => r.kind === "birth")).toHaveLength(summary.ledger.births);
    expect(life.filter((r) => r.kind === "division")).toHaveLength(summary.ledger.divisions);
    expect(life.filter((r) => r.kind === "constructed-death")).toHaveLength(living.length);
    const division = flows
      .filter((r) => r.channel === "division")
      .reduce((sum, r) => sum + Number(r.amount), 0);
    expect(division).toBeCloseTo(summary.ledger.divisionHeat, 9);
    const genomes = new Set(rows(directory, "genomes").map((r) => r.id));
    expect(life.every((r) => genomes.has(r.genome))).toBe(true);
  } finally {
    observer.close();
    world.dispose();
    rmSync(directory, { recursive: true, force: true });
  }
});
it("streams kernel facts without changing physics and reconciles applied reaction and expense totals", async () => {
  const engine = await loadEngine(),
    config = { width: 24, height: 24, sourceCount: 2, founders: 4 };
  const observed = engine.create(101, config),
    plain = engine.create(101, config),
    directory = mkdtempSync(join(tmpdir(), "antropy-study-"));
  const observer = new StudyObserver(observed, directory);
  try {
    for (let i = 0; i < 24; i++) {
      observer.beforeStep();
      observed.step();
      plain.step();
      if (i % 4 === 3) observer.flush();
    }
    observer.sample();
    observer.close();
    expect(observed.snapshot()).toEqual(plain.snapshot());
    const rows = readFileSync(join(directory, "flows.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { channel: string; amount: number });
    const sums = new Map<string, number>();
    for (const r of rows) sums.set(r.channel, (sums.get(r.channel) ?? 0) + r.amount);
    const l = observed.command<Summary>("summary").ledger.flows;
    for (const [key, name] of Object.entries({
      imported: "imported",
      exported: "exported",
      reacted: "reacted",
      motors: "motors",
      transport: "transport",
      maintenance: "maintenance",
      learning: "learning",
      repair: "repair",
      construction: "construction",
      constructed: "constructed",
      reactionHeat: "reaction_heat",
    }))
      expect(sums.get(name) ?? 0, name).toBeCloseTo(l[key as keyof typeof l], 9);
  } finally {
    observer.close();
    observed.dispose();
    plain.dispose();
    rmSync(directory, { recursive: true, force: true });
  }
});
