/** Explicit fault injection in the isolated browser only; never used by the application. */
export async function faultChecks(connection, workerSession, scripts, records) {
  const page = connection.page;
  await page.send("Debugger.enable", {}, workerSession);
  const url = scripts.find((value) => value.includes("/src/engine/renderer.ts"));
  if (!url) throw new Error("Cannot locate renderer for graphics-loss injection");
  await page.send(
    "Runtime.evaluate",
    {
      expression: `import(${JSON.stringify(url)}).then(({Renderer})=>{
      const draw=Renderer.prototype.draw;
      Renderer.prototype.draw=function(...args) {
        Renderer.prototype.draw=draw;
        globalThis.faultGraphics={gl:this.gl,lostAt:performance.now(),restoredAt:null};
        this.canvas.addEventListener('webglcontextrestored',()=>{
          globalThis.faultGraphics.restoredAt=performance.now();
        },{once:true});
        globalThis.graphicsLoss=this.gl.getExtension('WEBGL_lose_context');
        if(!globalThis.graphicsLoss)throw new Error('Context-loss extension unavailable');
        globalThis.graphicsLoss.loseContext();
        return null;
      };
    })`,
      awaitPromise: true,
    },
    workerSession
  );
  await page.evaluate("window.callWorker('inspect',{cell:1})");
  await waitFor(page, "window.check.samples.at(-1)?.error?.includes('Graphics context lost')");
  const lost = await page.evaluate("window.check.samples.at(-1)");
  const exportedBytes = await page.evaluate("window.callWorker('export').then(blob=>blob.size)");
  if (!exportedBytes) throw new Error("Paused graphics-loss world could not be exported");
  await page.send(
    "Runtime.evaluate",
    { expression: "globalThis.graphicsLoss.restoreContext()" },
    workerSession
  );
  await waitFor(page, "!window.check.samples.at(-1)?.error");
  await page.evaluate(`window.callWorker('recover',{id:${JSON.stringify(records[0].id)}})`);
  const restored = await page.evaluate("window.check.samples.at(-1)");
  if (restored.summary.tick !== records[0].tick) throw new Error("Recovery tick disagrees");
  await page.send(
    "Runtime.evaluate",
    {
      expression: "setTimeout(()=>{throw new Error('Injected operational worker failure')},0)",
    },
    workerSession
  );
  await waitFor(
    page,
    "[...document.querySelectorAll('[role=alert]')].some(e=>e.textContent.includes('Injected operational worker failure'))"
  );
  await page.evaluate(
    "[...document.querySelectorAll('.observation-dock button')].find(b=>b.textContent==='Saves').click()"
  );
  const reportAvailable = await page.evaluate(
    "[...document.querySelectorAll('button')].some(e=>e.textContent.includes('Export runtime report')&&!e.disabled)"
  );
  if (!reportAvailable) throw new Error("Runtime report is unavailable after worker failure");
  return { lost, exportedBytes, restored, reportAvailable };
}

async function waitFor(page, expression) {
  for (let i = 0; i < 50; i++) {
    if (await page.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Fault check timed out: ${expression}`);
}
