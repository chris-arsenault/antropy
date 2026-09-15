/** Twenty manual ticks in an isolated profile: UI/shader check, not ecological evidence. */
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output] = process.argv.slice(2);
if (!executable || !site || !output)
  throw new Error("Provide Chromium, existing site and new output directory");
await mkdir(output);
const connection = await launch(executable, site);
const errors = [];
connection.page.listeners.add((m) => {
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails);
});
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await connection.page.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Display condition timed out: ${expression}`);
}
async function screenshot(name) {
  await new Promise((r) => setTimeout(r, 250));
  const result = await connection.page.send("Page.captureScreenshot", { format: "png" });
  await writeFile(`${output}/${name}.png`, Buffer.from(result.data, "base64"));
}
async function field(mode) {
  await connection.page.evaluate(`(() => {
    const select = document.querySelector('.chemical-controls select');
    select.value = ${JSON.stringify(mode)};
    select.dispatchEvent(new Event('change', { bubbles:true }));
  })()`);
}
try {
  await connection.page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitFor("!!document.querySelector('.chemical-panel')");
  for (let i = 1; i <= 20; i++) {
    await connection.page.evaluate(
      "[...document.querySelectorAll('button')].find(b => b.textContent === 'Step').click()"
    );
    await waitFor(`document.querySelector('.chemical-panel').textContent.includes('tick ${i}')`);
  }
  await screenshot("amount");
  await field("potential");
  await screenshot("potential");
  await connection.page.evaluate("document.querySelector('.chemical-panel tbody button').click()");
  await waitFor("document.querySelector('.chemical-controls select').value === 'chemical'");
  await screenshot("selected");
  await connection.page.evaluate(
    "document.querySelectorAll('.chemical-controls input[type=checkbox]').forEach(e => e.click())"
  );
  await screenshot("hazards");
  const result = await connection.page.evaluate(`({
    chemicals: document.querySelector('.chemical-panel').textContent,
    legend: document.querySelector('.chemical-legend').textContent,
    alerts: [...document.querySelectorAll('[role=alert]')].map(e=>e.textContent),
    genealogy: !!document.querySelector('[aria-label="Family population shares over time"]'),
    cells: document.querySelector('.population-totals dd').textContent,
    mode: document.querySelector('.chemical-controls select').value,
    paused: [...document.querySelectorAll('button')].some(b=>b.textContent==='Run')
  })`);
  await connection.page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await screenshot("narrow");
  result.narrowOverflow = await connection.page.evaluate(
    "document.documentElement.scrollWidth > innerWidth"
  );
  await writeFile(`${output}/result.json`, JSON.stringify({ ...result, errors }, null, 2));
  if (
    errors.length ||
    result.alerts.length ||
    !result.genealogy ||
    !result.paused ||
    result.narrowOverflow
  )
    throw new Error(JSON.stringify({ ...result, errors }));
  console.log(
    JSON.stringify({
      errors,
      cells: result.cells,
      mode: result.mode,
      paused: result.paused,
      narrowOverflow: result.narrowOverflow,
    })
  );
} finally {
  await connection.close();
}
