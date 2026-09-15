import { mkdir, writeFile, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { launch } from "./browserConnection.mjs";

const [executable, site, output, seconds = "1800"] = process.argv.slice(2);
const durationMs = Number(seconds) * 1000;
if (!Number.isFinite(durationMs) || durationMs < 1000 || durationMs > 1800000)
  throw new Error("Duration must be 1–1800 seconds");
if (!executable || !site || !output)
  throw new Error("Provide Chromium, existing site and new output directory");
await mkdir(output);
const binary = await readFile("public/antropy-engine.wasm");
await copyFile("public/antropy-engine.wasm", `${output}/engine.wasm`);
const binaryDigest = createHash("sha256").update(binary).digest("hex");
const connection = await launch(executable, site, true),
  processSamples = [];
try {
  const version = await connection.browser.send("Browser.getVersion");
  await connection.page.evaluate(`(() => {
    window.probe = {done:false, progress:[]};
    const source = 'import {runtimeProbe} from "${site}/harness/numerical/runtimeProbe.ts"; self.onmessage=async(e)=>{try{self.postMessage({result:await runtimeProbe(e.data)});}catch(error){self.postMessage({error:String(error),stack:error.stack});}};';
    const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    const worker=new Worker(url,{type:'module'});
    worker.onmessage=(e)=>{if(e.data.progress)window.probe.progress.push(e.data.progress);else {Object.assign(window.probe,e.data,{done:true});worker.terminate();URL.revokeObjectURL(url);}};
    worker.onerror=(e)=>{Object.assign(window.probe,{done:true,error:e.message});worker.terminate();};
    worker.postMessage({mode:'soak',founders:70,history:100000,repetitions:18000,durationMs:${durationMs}});
  })()`);
  const start = Date.now();
  let result;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const processes = await connection.browser.send("SystemInfo.getProcessInfo");
    const rss = [];
    for (const p of processes.processInfo) {
      const status = await readFile(`/proc/${p.id}/status`, "utf8").catch(() => "");
      const value = /VmRSS:\s+(\d+)/.exec(status);
      if (value) rss.push({ pid: p.id, type: p.type, rssKiB: Number(value[1]) });
    }
    const heap = await connection.page.send("Runtime.getHeapUsage");
    result = await connection.page.evaluate(
      "({done:window.probe.done,error:window.probe.error,last:window.probe.progress.at(-1)})"
    );
    const sample = { wallMs: Date.now() - start, heap, rss, ...result };
    processSamples.push(sample);
    await writeFile(
      `${output}/progress.json`,
      JSON.stringify({ version, binaryDigest, processSamples }, null, 2)
    );
    if (processSamples.length % 6 === 0) console.log(JSON.stringify(sample));
    if (result.done || Date.now() - start > durationMs + 10000) break;
    const recent = processSamples.slice(-6).map((s) => s.rss.reduce((n, p) => n + p.rssKiB, 0));
    if (
      recent.length === 6 &&
      recent.every((n, i) => i === 0 || n > recent[i - 1]) &&
      recent[5] - recent[0] > 262144
    )
      throw new Error("Unexplained process growth exceeded 256 MiB over six samples");
  }
  const final = await connection.page.evaluate("window.probe");
  await writeFile(
    `${output}/result.json`,
    JSON.stringify({ version, binaryDigest, processSamples, ...final }, null, 2)
  );
  if (!final.done || final.error)
    throw new Error(final.error ?? "Operational wall budget exceeded");
  console.log(JSON.stringify({ done: true, wallMs: Date.now() - start, last: result.last }));
} finally {
  await connection.close();
}
