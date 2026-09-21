import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output, mode] = process.argv.slice(2);
if (!executable || !site || !output)
  throw new Error("Expected Chromium, existing site, new output directory");
await mkdir(output);
const connection = await launch(executable, site);
try {
  const version = await connection.browser.send("Browser.getVersion");
  const isolation = await connection.page.evaluate(
    "({isolated: crossOriginIsolated, cores: navigator.hardwareConcurrency})"
  );
  if (!isolation.isolated) throw new Error("Existing site lacks cross-origin isolation");
  const cases =
    mode === "scale" || mode === "large"
      ? [1, 10, 20].flatMap((scale) =>
          [1, 6].flatMap((workers) =>
            [2000, 48 * scale].map((population) => ({ workers, population, scale }))
          )
        )
      : [1, 2, 4, 6].map((workers) => ({ workers, population: 2000, scale: 1 }));
  for (const settings of cases.filter((s) => mode !== "large" || s.scale === 20)) {
    const { workers, population, scale } = settings;
    const result = await connection.page.evaluate(`new Promise((resolve, reject) => {
      const source = 'import { multicoreProbe } from "${site}/harness/numerical/multicoreProbe.ts"; self.onmessage = async e => { try { self.postMessage({result: await multicoreProbe(e.data.workers, e.data.population, e.data.scale)}); } catch (error) { self.postMessage({error: String(error), stack: error.stack}); } };';
      const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
      const worker = new Worker(url, {type:'module'});
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Multicore probe exceeded 90 seconds')); }, 90000);
      worker.onmessage = e => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(e.data); };
      worker.onerror = e => { clearTimeout(timer); worker.terminate(); reject(new Error(e.message)); };
      worker.postMessage(${JSON.stringify(settings)});
    })`);
    await writeFile(
      `${output}/${workers}-${population}-${scale}.json`,
      JSON.stringify({ version, isolation, ...result }, null, 2)
    );
    console.log(
      JSON.stringify({
        workers,
        population,
        scale,
        error: result.error,
        tps: result.result?.tps,
        glError: result.result?.glError,
      })
    );
    if (result.error) throw new Error(result.error);
  }
} finally {
  await connection.close();
}
