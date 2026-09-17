/** Only the first candidate selected by the predeclared rule is eligible. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Genotype } from "../../src/engine/types";
import { chemicalContext } from "../lib/chemicalGenotypes";
import { frozen, install, pulse } from "../lib/engineFixtures";
import { runQuick } from "../lib/quickRun";
import { type QuickScenario } from "../lib/quickScenario";

const [study] = process.argv.slice(2);
if (!study) throw new Error("Provide the completed study directory");
const selected = [27, 101]
  .map((seed) => join(study, `main-${seed}-on`, "candidate.json"))
  .find(existsSync);
const registration = JSON.parse(readFileSync(join(study, "registration.json"), "utf8"));
const deadline = registration.started + 5.5 * 60 * 60 * 1000;
if (!selected) {
  writeFileSync(join(study, "followup.json"), JSON.stringify({ status: "no eligible candidate" }));
} else if (Date.now() + 10 * 60 * 1000 > deadline) {
  writeFileSync(
    join(study, "followup.json"),
    JSON.stringify({ status: "budget exhausted", selected })
  );
} else {
  const candidate = JSON.parse(readFileSync(selected, "utf8")) as { genotype: Genotype };
  for (const feedback of [true, false])
    for (const swap of [false, true]) {
      const name = `followup-${feedback ? "on" : "off"}-${swap ? "swapped" : "forward"}`;
      const scenario: QuickScenario = {
        name,
        hypothesis:
          "The candidate genotype gains more against the founder when shielding operates.",
        specification: { selected, feedback, mutation: false, learning: false },
        target: { x: 16, y: 16, radius: 2 },
        create(engine, seed) {
          const world = engine.create(seed, {
            ...frozen,
            width: 64,
            height: 64,
            founders: 2,
            mesh: 2,
            sourceCount: 0,
            habitatFeedback: feedback,
          });
          try {
            for (const center of [16, 48]) pulse(world, [[0, 12]], [center, center], 2);
            install(
              world,
              [
                { label: "candidate", genotype: candidate.genotype },
                { label: "founder", genotype: chemicalContext(engine).genotype },
              ],
              [16, 48].map((center, i) => ({
                cell: i + 1,
                variant: (i + Number(swap)) % 2,
                x: center,
                y: center,
                heading: 0,
              }))
            );
            return world;
          } catch (error) {
            world.dispose();
            throw error;
          }
        },
      };
      await runQuick(scenario, {
        seed: 27,
        ticks: 1500,
        swap,
        wallSeconds: 120,
        output: join(study, name),
      });
    }
  writeFileSync(join(study, "followup.json"), JSON.stringify({ status: "complete", selected }));
}
