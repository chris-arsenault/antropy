import { loadEngine } from "./engine";

const engine = await loadEngine();
const world = engine.create(101, { founders: 0, sourceCount: 0 });
world.command("loadFixture", { population: 2000, growth: process.argv.includes("--growth") });
world.step(10);
const totals = Array<number>(9).fill(0);
for (let i = 0; i < 10; i++) {
  world.command<number[]>("profile").forEach((value, j) => {
    totals[j] += value / 10;
  });
}
console.log(
  JSON.stringify(
    Object.fromEntries(
      [
        "fields",
        "disturbance",
        "sensingController",
        "movement",
        "injury",
        "transport",
        "metabolism",
        "contactsBirths",
        "housekeeping",
      ].map((name, i) => [name, totals[i]])
    ),
    null,
    2
  )
);
world.dispose();
