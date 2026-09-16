import { readFile, writeFile } from "node:fs/promises";

/** Process and JS memory alongside the application's bounded scalar status. */
export async function sampleMemory(connection, workerSession, wallMs, status) {
  const { processInfo } = await connection.browser.send("SystemInfo.getProcessInfo");
  const processes = await Promise.all(
    processInfo.map(async ({ id, type }) => {
      const text = await readFile(`/proc/${id}/status`, "utf8").catch(() => "");
      return { id, type, rssKiB: Number(/VmRSS:\s+(\d+)/.exec(text)?.[1] ?? 0) };
    })
  );
  const main = await connection.page.send("Runtime.getHeapUsage");
  const dom = await connection.page.send("Memory.getDOMCounters");
  const timing = await connection.page.evaluate(`(() => {
    const entries = performance.getEntriesByType('measure');
    return {count:entries.length, examples:entries.slice(-5).map(e=>e.name),
      marks:performance.getEntriesByType('mark').length};
  })()`);
  const worker = workerSession
    ? await connection.page.send("Runtime.getHeapUsage", {}, workerSession)
    : null;
  return { wallMs, processes, main, worker, dom, timing, status };
}

export async function recordMemory(connection, workerSession, samples, output, wallMs, status) {
  const sample = await sampleMemory(connection, workerSession, wallMs, status);
  samples.push(sample);
  await writeFile(`${output}/memory.json`, JSON.stringify(samples, null, 2));
  const totals = samples.slice(-6).map((s) => s.processes.reduce((n, p) => n + p.rssKiB, 0));
  console.log(
    JSON.stringify({
      wallMs,
      tick: status.summary.tick,
      population: status.summary.population,
      wasm: status.memoryBytes,
      rssKiB: totals.at(-1),
      main: sample.main,
      worker: sample.worker,
      dom: sample.dom,
      timing: sample.timing,
    })
  );
  if (
    totals.length === 6 &&
    totals.every((n, i) => !i || n > totals[i - 1]) &&
    totals[5] - totals[0] > 262144
  )
    throw new Error("Process memory grew more than 256 MiB over six samples");
}
