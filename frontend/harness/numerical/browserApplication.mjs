/** Exercise the actual page, bridge, worker, renderer and storage in an isolated profile. */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { launch } from "./browserConnection.mjs";
import { faultChecks } from "./browserFaultChecks.mjs";
import { useBuild } from "./browserBuild.mjs";
import { recordMemory } from "./browserMemory.mjs";
const durationMs = Number(process.env.ANTROPY_DURATION_SECONDS ?? 0) * 1000;
if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 1800000)
  throw new Error("Operational duration must be between 0 and 1800 seconds");
const [executable, site, output, packagePath] = process.argv.slice(2);
if (!executable || !site || !output)
  throw new Error("Provide Chromium, existing site and new output directory");
await mkdir(output);
const binary = await readFile(
  process.env.ANTROPY_PRODUCTION === "1" ? "dist/antropy-engine.wasm" : "public/antropy-engine.wasm"
);
const binaryDigest = createHash("sha256").update(binary).digest("hex");
await writeFile(`${output}/engine.wasm`, binary);
const renderSources = {};
for (const path of ["renderer", "shaders", "spriteBatch", "worker", "bridge", "session"]) {
  const bytes = await readFile(`src/engine/${path}.ts`);
  renderSources[path] = createHash("sha256").update(bytes).digest("hex");
  await writeFile(`${output}/${path}.ts`, bytes);
}
const connection = await launch(executable, site, false, process.env.ANTROPY_PRODUCTION === "1");
try {
  const version = await connection.browser.send("Browser.getVersion");
  const trace = [];
  connection.browser.listeners.add((message) => {
    if (message.method === "Tracing.dataCollected") trace.push(...message.params.value);
  });
  let workerSession;
  const scripts = [];
  connection.page.listeners.add((m) => {
    if (m.method === "Target.attachedToTarget" && m.params.targetInfo.type === "worker")
      workerSession = m.params.sessionId;
    if (m.method === "Debugger.scriptParsed") scripts.push(m.params.url);
  });
  await connection.page.send("Target.setAutoAttach", {
    autoAttach: true,
    waitForDebuggerOnStart: false,
    flatten: true,
  });
  await connection.page.send("Page.enable");
  await connection.page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await connection.page.send("Page.addScriptToEvaluateOnNewDocument", {
    runImmediately: true,
    source: `
    window.check = {samples:[], errors:[], replies:{}, id:-1};
    const NativeWorker=Worker;
    window.Worker=class extends NativeWorker {
      constructor(...args) {super(...args); window.runtimeWorker=this;
        this.addEventListener('message',({data:m})=>{
          if(m.kind==='reply' && m.id<0) window.check.replies[m.id]=m;
          if(m.kind==='fault') window.check.errors.push(m.value);
          if(m.kind==='definition') window.check.definition=m.value;
          if(m.kind==='observation') {
            const s=window.check.status=Object.assign(window.check.status??{},m.value.status);
            if(s.kernelDigest) window.check.kernelDigest=s.kernelDigest;
            if(s.summary) window.check.samples.push({at:performance.now(),summary:s.summary,
              throughput:s.throughput,memoryBytes:s.memoryBytes,error:s.error,workerWork:s.workerWork});
            window.check.selected=m.value.inspection?.patch?.ancestor?.id ?? window.check.selected;
          }
        });
      }
    };
    window.callWorker=(op,payload={})=>new Promise((resolve,reject)=>{
      const id=window.check.id--; window.runtimeWorker.postMessage({id,op,payload});
      const start=performance.now(); const timer=setInterval(()=>{
        const result=window.check.replies[id];
        if(result){clearInterval(timer);delete window.check.replies[id];result.ok?resolve(result.value):reject(new Error(result.error));}
        else if(performance.now()-start>15000){clearInterval(timer);reject(new Error('Request timed out: '+op));}
      },10);
    });`,
  });
  if (process.env.ANTROPY_PRODUCTION === "1") await useBuild(connection.page, site);
  await connection.page.send("Page.navigate", { url: site });
  await connection.page.send("Page.bringToFront");
  for (let i = 0; i < 100; i++) {
    if (await connection.page.evaluate("!!window.check?.samples.length")) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (packagePath)
    await connection.page.evaluate(
      `fetch(${JSON.stringify(site + "/" + packagePath)}).then(r=>r.blob()).then(blob=>window.callWorker('import',{blob}))`
    );
  const initial = await connection.page.evaluate(
    "({kernelDigest:window.check.kernelDigest,visibility:document.visibilityState,canvas:[...document.querySelectorAll('canvas')].map(c=>[c.clientWidth,c.clientHeight]),definition:window.check.definition,last:window.check.samples.at(-1),alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)})"
  );
  if (!initial.last) throw new Error("Application did not initialize");
  await connection.page.evaluate(
    "document.querySelectorAll('details').forEach(e=>e.open=true); window.callWorker('inspect',{cell:1})"
  );
  await connection.page.evaluate("window.callWorker('speed',{value:'max'})");
  if (process.env.ANTROPY_CLEAR_TIMINGS === "1")
    await connection.page.evaluate("setInterval(()=>performance.clearMeasures(), 1000)");
  if (workerSession) {
    if (process.env.ANTROPY_RENDER_OFF === "1") {
      await connection.page.send("Debugger.enable", {}, workerSession);
      const url = scripts.find((url) => url.includes("/src/engine/renderer.ts"));
      if (!url) throw new Error("Renderer module unavailable for diagnostic control");
      await connection.page.send(
        "Runtime.evaluate",
        {
          expression: `import(${JSON.stringify(url)}).then(m=>{m.Renderer.prototype.draw=()=>null;})`,
          awaitPromise: true,
        },
        workerSession
      );
    }
    if (!durationMs) {
      await connection.page.send("Profiler.enable", {}, workerSession);
      await connection.page.send("Profiler.start", {}, workerSession);
    }
  }
  await connection.page.evaluate("window.callWorker('running',{value:true})");
  if (process.env.ANTROPY_TRACE === "1")
    await connection.browser.send("Tracing.start", {
      categories: "gpu,cc,renderer.scheduler,disabled-by-default-gpu.service",
      transferMode: "ReportEvents",
    });
  if (!durationMs) {
    await connection.page.send("Profiler.enable");
    await connection.page.send("Profiler.start");
  }
  const started = Date.now();
  const memory = [];
  let lastMemory = -10000;
  for (;;) {
    await new Promise((r) => setTimeout(r, 250));
    const state = await connection.page.evaluate("window.check.samples.at(-1)");
    const elapsed = Date.now() - started;
    if (durationMs && elapsed - lastMemory >= 10000) {
      await recordMemory(connection, workerSession, memory, output, elapsed, state);
      lastMemory = elapsed;
    }
    if (
      (!durationMs && state.summary.tick >= (packagePath ? 100 : 300)) ||
      state.summary.stopReason ||
      state.error ||
      elapsed > (durationMs || 30000)
    )
      break;
  }
  await connection.page.evaluate("window.callWorker('running',{value:false})");
  if (process.env.ANTROPY_TRACE === "1") {
    const completed = new Promise((resolve) =>
      connection.browser.listeners.add((message) => {
        if (message.method === "Tracing.tracingComplete") resolve();
      })
    );
    await connection.browser.send("Tracing.end");
    await completed;
    await writeFile(`${output}/browser-trace.json`, JSON.stringify(trace));
  }
  if (!durationMs)
    await connection.page
      .send("Profiler.stop")
      .then((r) => writeFile(`${output}/main.cpuprofile`, JSON.stringify(r.profile)));
  if (workerSession && !durationMs)
    await connection.page
      .send("Profiler.stop", {}, workerSession)
      .then((r) => writeFile(`${output}/worker.cpuprofile`, JSON.stringify(r.profile)));
  const saveAt = Date.now();
  await connection.page.evaluate("window.callWorker('save',{reason:'manual'})");
  const saveMs = Date.now() - saveAt;
  const records = await connection.page.evaluate("window.callWorker('recoveries')");
  const result = await connection.page.evaluate(
    "({samples:window.check.samples,errors:window.check.errors,selected:window.check.selected,alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent),panels:[...document.querySelectorAll('summary')].map(e=>e.textContent)})"
  );
  await writeFile(
    `${output}/result.json`,
    JSON.stringify(
      {
        version,
        binaryDigest,
        renderSources,
        production: process.env.ANTROPY_PRODUCTION === "1",
        timingControl: process.env.ANTROPY_CLEAR_TIMINGS === "1",
        initial,
        renderDisabled: process.env.ANTROPY_RENDER_OFF === "1",
        saveMs,
        records,
        ...result,
      },
      null,
      2
    )
  );
  await connection.page
    .send("Page.captureScreenshot", { format: "png" })
    .then((r) => writeFile(`${output}/page.png`, Buffer.from(r.data, "base64")));
  if (result.errors.length || result.alerts.length)
    throw new Error(JSON.stringify(result.errors.concat(result.alerts)));
  if (process.env.ANTROPY_FAULTS === "1") {
    try {
      const faults = await faultChecks(connection, workerSession, scripts, records);
      await writeFile(`${output}/faults.json`, JSON.stringify(faults, null, 2));
    } catch (error) {
      const state = await connection.page.evaluate(
        "({last:window.check.samples.at(-1),errors:window.check.errors,alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)})"
      );
      const graphics = await connection.page.send(
        "Runtime.evaluate",
        {
          expression:
            "({lost:globalThis.faultGraphics?.gl.isContextLost(),lostAt:globalThis.faultGraphics?.lostAt,restoredAt:globalThis.faultGraphics?.restoredAt})",
          returnByValue: true,
        },
        workerSession
      );
      await writeFile(
        `${output}/faults.json`,
        JSON.stringify({ error: String(error), graphics: graphics.result.value, ...state }, null, 2)
      );
      throw error;
    }
  }
  console.log(
    JSON.stringify({
      initial: initial.last.summary.population,
      final: result.samples.at(-1),
      saveMs,
      selected: result.selected,
      panels: result.panels.length,
    })
  );
} finally {
  await connection.close();
}
