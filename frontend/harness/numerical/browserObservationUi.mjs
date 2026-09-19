/** Bounded UI navigation check on an existing server, using a fresh browser profile. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output] = process.argv.slice(2);
if (!executable || !site || !output)
  throw new Error("Provide Chromium, existing site and new output directory");
await mkdir(output);
const connection = await launch(executable, site, false, true);
const { page } = connection;
const started = Date.now(),
  results = [];
const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(expression) {
  for (let i = 0; i < 100; i++) {
    if (Date.now() - started > 110000) throw new Error("UI check exceeded its wall budget");
    if (await page.evaluate(expression)) return;
    await wait();
  }
  throw new Error(`Timed out: ${expression}`);
}
async function click(text) {
  await page.evaluate(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)});
    if (!b || b.disabled) throw new Error('Unavailable button: ' + ${JSON.stringify(text)});
    b.focus(); b.click();
  })()`);
  await wait();
}
async function screenshot(name) {
  const shot = await page.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${output}/${name}.png`, Buffer.from(shot.data, "base64"));
}
async function layout(name) {
  const bounds = await page.evaluate(`(() => {
    const rect = s => {const r=document.querySelector(s)?.getBoundingClientRect();
      return r ? [r.x,r.y,r.width,r.height,r.right,r.bottom] : null;};
    return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
      canvas:rect('canvas'),hud:rect('.game-hud'),dock:rect('.observation-dock'),panel:rect('dialog[open]'),
      sameCanvas:window.firstCanvas===document.querySelector('canvas'),workers:window.uiWorkers};
  })()`);
  assert.equal(bounds.scroll, bounds.width);
  assert.deepEqual(bounds.canvas.slice(0, 4), [0, 0, bounds.width, bounds.height]);
  for (const r of [bounds.hud, bounds.dock, bounds.panel].filter(Boolean)) {
    assert.ok(
      r[0] >= 0 && r[1] >= 0 && r[4] <= bounds.width && r[5] <= bounds.height,
      JSON.stringify(bounds)
    );
  }
  if (bounds.panel) {
    assert.ok(bounds.panel[1] >= bounds.hud[5], "Panel overlaps run controls");
    assert.ok(bounds.panel[5] <= bounds.dock[1], "Panel overlaps dock");
  }
  assert.equal(bounds.sameCanvas, true);
  assert.equal(bounds.workers, 2); // React StrictMode performs one initial effect replay.
  results.push({ name, ...bounds });
}
async function webChecks() {
  await click("Web");
  await until("!!document.querySelector('.web-route-table tbody tr')");
  await screenshot("desktop-web");
  await click("Enzyme input");
  await click("Enzyme output");
  for (const mode of ["supported", "environment"]) {
    await page.evaluate(`(() => {
      const s=document.querySelector('.web-controls select'); s.value='${mode}';
      s.dispatchEvent(new Event('change',{bubbles:true}));
    })()`);
    await until(`window.uiWeb?.mode==='${mode}'`);
    await screenshot(`desktop-web-${mode}`);
  }
  await click("Next routes");
  await until("window.uiWeb?.offset===64");
  await page.evaluate("document.querySelector('.window-content').scrollTop=0");
  await screenshot("desktop-environment-web");
  await page.evaluate(
    "document.querySelector('.web-node').dispatchEvent(new MouseEvent('click',{bubbles:true}))"
  );
  await until("window.uiWeb?.focus!==null");
  await click("Show chemical on map");
  await click("Map");
  await until("window.uiWeb===null");
  assert.equal(await page.evaluate("document.querySelector('.map-tools select').value"), "15");
}
try {
  await page.send("Page.enable");
  await page.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
    window.uiWorkers=0; window.uiTick=0; window.uiErrors=[]; window.uiWeb=null;
    const NativeWorker=Worker;
    window.Worker=class extends NativeWorker {
      constructor(...args){super(...args);window.uiWorkers++;
        this.addEventListener('message',({data:m})=>{
          if(m.kind==='observation' && m.value.status?.summary) window.uiTick=m.value.status.summary.tick;
          if(m.kind==='observation' && m.value.status && 'chemicalWeb' in m.value.status) window.uiWeb=m.value.status.chemicalWeb;
          if(m.kind==='fault') window.uiErrors.push(m.value);
        });
      }
    };
    addEventListener('error',e=>window.uiErrors.push(e.message));
  `,
  });
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send("Page.navigate", { url: site });
  await until("document.querySelector('.world-status')?.textContent.includes('48')");
  await page.evaluate("window.firstCanvas=document.querySelector('canvas')");
  await layout("desktop-world");
  await screenshot("desktop-world");
  await click("Step");
  await until("window.uiTick===1");
  for (const panel of [
    "Chemistry",
    "Web",
    "Population",
    "Lineage",
    "Cell",
    "Map",
    "Saves",
    "Settings",
  ]) {
    await click(panel);
    await layout(`desktop-${panel}`);
    if (["Chemistry", "Lineage"].includes(panel)) await screenshot(`desktop-${panel}`);
  }
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await until("!document.querySelector('dialog[open]')");
  assert.equal(await page.evaluate("document.activeElement.textContent"), "Settings");
  await webChecks();
  await click("Lineage");
  await click("Founder 1");
  await until(
    "document.querySelector('dialog[open]')?.textContent.includes('Funded body and inherited genes')"
  );
  await screenshot("desktop-cell");
  await click("Close Esc");
  await click("Run");
  await wait(500);
  await click("Pause");
  assert.ok(await page.evaluate("window.uiTick>1 && window.uiTick<=300"));
  await click("Saves");
  await click("Save locally");
  await until("document.querySelector('dialog[open] .panel [role=status]')?.textContent==='Done'");
  await click("Restore selected state");
  await until("document.querySelector('.world-status')?.textContent.includes('Paused')");
  for (const size of [
    [390, 844],
    [844, 390],
  ]) {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: size[0],
      height: size[1],
      deviceScaleFactor: 1,
      mobile: false,
    });
    await wait();
    for (const panel of ["Map", "Chemistry", "Web", "Lineage", "Cell", "Settings"]) {
      await click(panel);
      await layout(`${size.join("x")}-${panel}`);
      if (panel === "Chemistry") await screenshot(`${size.join("x")}-chemistry`);
      if (panel === "Web") await screenshot(`${size.join("x")}-web`);
    }
  }
  assert.deepEqual(await page.evaluate("window.uiErrors"), []);
  const tick = await page.evaluate("window.uiTick");
  await writeFile(
    `${output}/result.json`,
    JSON.stringify({ tick, wallMs: Date.now() - started, results }, null, 2)
  );
  console.log(JSON.stringify({ tick, layouts: results.length, output }));
} catch (error) {
  await screenshot("failure");
  throw error;
} finally {
  await connection.close();
}
