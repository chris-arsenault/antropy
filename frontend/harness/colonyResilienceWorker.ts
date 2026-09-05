import {
  prepareResilienceBaseline,
  runResilienceTreatment,
  type ResilienceEpisodeJob,
  type ResilienceEpisodeResult,
} from "./lib/colonyResilience";

export interface TimedResilienceResult {
  job: ResilienceEpisodeJob;
  result: ResilienceEpisodeResult;
  wallMs: number;
}

export interface ResilienceWorkerResult {
  setupWallMs: number;
  treatments: TimedResilienceResult[];
}

function execute(jobs: ResilienceEpisodeJob[]): ResilienceWorkerResult {
  if (jobs.length === 0) throw new Error("resilience worker requires at least one treatment");
  const setupStarted = Date.now();
  const baseline = prepareResilienceBaseline(jobs[0]);
  const setupWallMs = Date.now() - setupStarted;
  const treatments = jobs.map((job) => {
    const started = Date.now();
    const result = runResilienceTreatment(baseline, job);
    return { job, result, wallMs: Date.now() - started };
  });
  return { setupWallMs, treatments };
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  process.stdout.write(JSON.stringify(execute(JSON.parse(input) as ResilienceEpisodeJob[])));
});
