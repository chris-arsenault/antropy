import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { type ColonyModel } from "./learnedColony";
import { type runColonyOutcome } from "./colonyOutcomeRun";

export type OutcomeResults = ReturnType<typeof runColonyOutcome>[];

/** Persistent local simulation processes; no colony state or weights are published. */
export class ColonyOutcomePool {
  private readonly children: ChildProcessWithoutNullStreams[] = [];
  constructor(private readonly jobs: number) {}

  async evaluate(
    models: readonly (ColonyModel | null)[],
    seeds: number[],
    ticks: number,
    warmup = 0
  ): Promise<OutcomeResults[]> {
    const results = new Array<OutcomeResults>(models.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(this.jobs, models.length) }, async (_, index) => {
        const child = this.children[index] ?? this.start();
        while (next < models.length) {
          const position = next++;
          results[position] = await this.request(child, {
            model: models[position],
            seeds,
            ticks,
            deprivation: 0,
            warmup,
          });
        }
      })
    );
    return results;
  }

  private start() {
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    const child = spawn("pnpm", ["exec", "tsx", "harness/colonyOutcomeWorker.ts"], {
      stdio: "pipe",
    });
    child.stderr.pipe(process.stderr);
    this.children.push(child);
    return child;
  }

  private request(child: ChildProcessWithoutNullStreams, job: unknown): Promise<OutcomeResults> {
    return new Promise((resolve, reject) => {
      const lines = createInterface({ input: child.stdout });
      const fail = (code: number | null) => {
        lines.close();
        reject(new Error(`outcome worker exited ${code}`));
      };
      child.once("exit", fail);
      lines.once("line", (line) => {
        child.removeListener("exit", fail);
        lines.close();
        try {
          resolve(JSON.parse(line) as OutcomeResults);
        } catch (error) {
          reject(error);
        }
      });
      child.stdin.write(JSON.stringify(job) + "\n");
    });
  }

  close(): void {
    for (const child of this.children) child.stdin.end();
  }
}
