import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output] = process.argv.slice(2);
if (!executable || !site || !output)
  throw new Error("Provide Chromium executable, existing site URL, new output directory");
await mkdir(output);
const connection = await launch(executable, site);
const cases = [
  { mode: "observe", founders: 48, history: 0, repetitions: 200 },
  { mode: "save", founders: 48, history: 0, repetitions: 100 },
  { mode: "save", founders: 70, history: 100000, repetitions: 100 },
  { mode: "render", founders: 70, history: 100000, repetitions: 200 },
].filter(
  (settings) => !process.env.ANTROPY_PROBE_MODE || settings.mode === process.env.ANTROPY_PROBE_MODE
);
try {
  const version = await connection.browser.send("Browser.getVersion");
  for (const settings of cases) {
    const expression = `new Promise((resolve, reject) => {
      const source = 'import { runtimeProbe } from "${site.replace(/\/$/, "")}/harness/numerical/runtimeProbe.ts"; self.onmessage = async (e) => { try { self.postMessage({result: await runtimeProbe(e.data)}); } catch (error) { self.postMessage({error: String(error), stack: error.stack}); } };';
      const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
      const worker = new Worker(url, {type:'module'});
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Probe exceeded 130 seconds')); }, 130000);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); URL.revokeObjectURL(url); resolve(e.data); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); reject(new Error(e.message)); };
      worker.postMessage(${JSON.stringify(settings)});
    })`;
    const result = await connection.page.evaluate(expression);
    await writeFile(
      `${output}/${settings.mode}-${settings.founders}.json`,
      JSON.stringify({ version, ...result }, null, 2)
    );
    console.log(
      JSON.stringify({
        settings,
        error: result.error,
        first: result.result?.samples[0],
        last: result.result?.samples.at(-1),
      })
    );
  }
} finally {
  await connection.close();
}
