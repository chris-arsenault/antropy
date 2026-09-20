/** Registered isolated UI check on the existing site; 30 ticks, 120-second cap. */
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output] = process.argv.slice(2);
if (!executable || !site || !output) throw new Error("Expected Chromium, existing site, output");
await mkdir(output);
const connection = await launch(executable, site, false, true),
  page = connection.page;
const errors = [];
page.listeners.add((e) => {
  if (e.method === "Runtime.exceptionThrown") errors.push(e.params);
});
const deadline = Date.now() + 120000;
const wait = async (expression) => {
  while (Date.now() < deadline) {
    if (await page.evaluate(`Boolean(${expression})`)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  const text = await page.evaluate("document.body.innerText");
  await writeFile(`${output}/failure.json`, JSON.stringify({ expression, text, errors }, null, 2));
  throw new Error(`Browser deadline: ${expression}`);
};
const click = async (label) => {
  await page.evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});
    if(!b || b.disabled) throw new Error('Button unavailable: '+${JSON.stringify(label)}); b.click(); })()`);
};
const screenshot = async (name) => {
  const result = await page.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${output}/${name}.png`, Buffer.from(result.data, "base64"));
};
try {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.send("Page.navigate", { url: site });
  await wait("document.querySelector('.world-status')?.textContent.includes('Tick 0')");
  await click("Web");
  await wait("document.body.textContent.includes('Advance the simulation to collect')");
  for (let i = 1; i <= 4; i++) {
    await click("Step");
    await wait(`document.querySelector('.world-status strong')?.textContent === '${i}'`);
  }
  await wait("document.querySelectorAll('.web-route-table tbody tr').length > 0");
  await screenshot("measured-flow");
  await page.evaluate(
    `(() => { const s=document.querySelector('.web-controls select'); s.value='primary'; s.dispatchEvent(new Event('change',{bubbles:true})); })()`
  );
  await wait("document.body.textContent.includes('Each cell appears once')");
  await click("Primary role");
  await wait("document.querySelector('.phenotype-panel')");
  await click("Pin selected descendants");
  await wait("document.querySelector('.pin-label')");
  await click("Highlight selected group");
  await wait("document.querySelector('.group-highlight')");
  for (let i = 5; i <= 30; i++) {
    await click("Step");
    await wait(`document.querySelector('.world-status strong')?.textContent === '${i}'`);
  }
  await screenshot("phenotypes-desktop");
  const pinBefore = await page.evaluate("document.querySelector('.pin-label').textContent");
  await click("Phenotypes");
  await wait("!document.querySelector('.phenotype-panel')");
  await screenshot("highlight-map");
  await click("Saves");
  await click("Save locally");
  await wait("document.querySelectorAll('dialog[open] .panel select option').length > 1");
  await click("Restore selected state");
  await wait("document.body.textContent.includes('Restored or new population; paused')");
  await click("Phenotypes");
  await wait("document.querySelector('.pin-label')");
  const pinAfter = await page.evaluate("document.querySelector('.pin-label').textContent");
  if (pinBefore !== pinAfter) throw new Error("Pin changed after local restore");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await screenshot("phenotypes-mobile");
  const alerts = await page.evaluate(
    "[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)"
  );
  await writeFile(
    `${output}/result.json`,
    JSON.stringify({ pinBefore, pinAfter, errors, alerts, ticks: 30 }, null, 2)
  );
  if (errors.length || alerts.length) throw new Error("Browser errors");
  console.log(JSON.stringify({ pinBefore, pinAfter, errors, alerts, ticks: 30 }));
} finally {
  await connection.close();
}
