/** Registered diagnostic in docs/session-runtime-review.md; isolated profile, existing server. */
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";
import { sampleMemory } from "./browserMemory.mjs";

const [executable, site, checkpoint, output] = process.argv.slice(2);
if (!output)
  throw new Error("Provide Chromium, existing site, checkpoint and new output directory");
await mkdir(output);
const connection = await launch(executable, site, false, true);
const results = [];
let workerSession;
const started = Date.now();
const call = (op, payload = {}) =>
  connection.page.evaluate(`window.callWorker(${JSON.stringify(op)},${JSON.stringify(payload)})`);
const read = () => connection.page.evaluate("window.check?.status");
const delay = () => new Promise((resolve) => setTimeout(resolve, 100));
async function wait(predicate) {
  while (!(await predicate())) {
    if (Date.now() - started > 180000) throw new Error("180-second diagnostic cap");
    await delay();
  }
}
async function measure(label) {
  const before = await read();
  const at = Date.now();
  await call("running", { value: true });
  await wait(async () => {
    const s = await read();
    if (s.error || s.summary.stopReason) throw new Error(JSON.stringify(s));
    return s.summary.tick - before.summary.tick >= 100 || Date.now() - at >= 10000;
  });
  await call("running", { value: false });
  await wait(async () => !(await read()).running);
  const after = await read();
  const memory = await sampleMemory(connection, workerSession, Date.now() - started, after);
  const row = {
    label,
    ticks: after.summary.tick - before.summary.tick,
    wallMs: Date.now() - at,
    work: Object.fromEntries(
      Object.entries(after.workerWork).map(([key, value]) => [key, value - before.workerWork[key]])
    ),
    memory,
  };
  results.push(row);
  console.log(JSON.stringify({ ...row, memory: { main: memory.main, worker: memory.worker } }));
}
try {
  connection.page.listeners.add((m) => {
    if (m.method === "Target.attachedToTarget" && m.params.targetInfo.type === "worker")
      workerSession = m.params.sessionId;
  });
  await connection.page.send("Target.setAutoAttach", {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: true,
  });
  await connection.page.send("Page.enable");
  await connection.page.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.check={status:{},id:-1,replies:{}};
      const NativeWorker=Worker;
      window.Worker=class extends NativeWorker { constructor(...args) { super(...args);
        window.runtimeWorker=this; this.addEventListener('message',({data:m})=>{
          if(m.kind==='reply' && m.id<0) window.check.replies[m.id]=m;
          if(m.kind==='observation') Object.assign(window.check.status,m.value.status);
        }); }};
      window.callWorker=(op,payload={})=>new Promise((resolve,reject)=>{
        const id=window.check.id--; window.runtimeWorker.postMessage({id,op,payload});
        const start=performance.now(); const timer=setInterval(()=>{
          const r=window.check.replies[id];
          if(r){clearInterval(timer);delete window.check.replies[id];r.ok?resolve(r.value):reject(new Error(r.error));}
          else if(performance.now()-start>30000){clearInterval(timer);reject(new Error('Timeout: '+op));}
        },10);
      });`,
  });
  await connection.page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await connection.page.send("Page.navigate", { url: site });
  await wait(async () => !!(await read())?.summary);
  await connection.page.evaluate(
    "[...document.querySelectorAll('.observation-dock button')].find(b=>b.textContent==='Saves').click()"
  );
  const { root } = await connection.page.send("DOM.getDocument");
  const { nodeId } = await connection.page.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: 'input[type="file"]',
  });
  await connection.page.send("DOM.setFileInputFiles", { nodeId, files: [checkpoint] });
  await wait(async () => (await read()).summary.tick === 83980);
  await call("speed", { value: "max" });
  await measure("restored-closed");
  await call("chemicalWeb", { mode: "measured", focus: null, offset: 0 });
  await measure("measured-web");
  await call("chemicalWeb", { enabled: false });
  await measure("closed-again");
  for (let i = 0; i < 4; i++) {
    const at = Date.now();
    await call("save", { reason: "manual" });
    results.push({
      label: "save",
      wallMs: Date.now() - at,
      memory: await sampleMemory(connection, workerSession, Date.now() - started, await read()),
    });
  }
  await measure("after-saves");
  await connection.page.send("HeapProfiler.collectGarbage");
  if (workerSession) await connection.page.send("HeapProfiler.collectGarbage", {}, workerSession);
  await measure("after-forced-gc");
  await call("save", { reason: "manual" });
  await call("recover");
  await measure("restored-same-worker");
  console.log(JSON.stringify({ saves: await call("recoveries") }));
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await connection.close();
}
