/** Registered display-only check: existing site, isolated profile, no simulation stepping. */
import { mkdir, writeFile } from "node:fs/promises";
import { launch } from "./browserConnection.mjs";

const [executable, site, output] = process.argv.slice(2);
if (!executable || !site || !output) throw new Error("Expected Chromium, existing site, output");
await mkdir(output);
const connection = await launch(executable, site, false, true);
const page = connection.page;
const errors = [];
page.listeners.add((event) => {
  if (event.method === "Runtime.exceptionThrown") errors.push(event.params);
});
const click = (label) =>
  page.evaluate(`
  (() => {
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});
  if(!button) throw new Error('Missing button'); button.click();
  })()
`);
const screenshot = async (name) => {
  await new Promise((resolve) => setTimeout(resolve, 250));
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
  for (let i = 0; i < 100; i++) {
    if (
      await page.evaluate(
        "!!document.querySelector('canvas') && document.body.textContent.includes('Tick 0')"
      )
    )
      break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const initial = await page.evaluate(`({
    cues:[...document.querySelectorAll('.map-context button')].map(b=>[b.textContent.trim(),b.getAttribute('aria-pressed')]),
    dialogs:document.querySelectorAll('dialog[open]').length,
    tickZero:document.body.textContent.includes('Tick 0')
  })`);
  if (
    !initial.tickZero ||
    initial.dialogs ||
    initial.cues.length !== 3 ||
    initial.cues.some((c) => c[1] !== "true")
  )
    throw new Error("Default map context missing");
  await screenshot("default");
  await click("Light");
  await screenshot("without-light");
  await click("Map");
  const controls = await page.evaluate(`({
    base:document.querySelector('.chemical-controls select').value,
    checks:[...document.querySelectorAll('.chemical-controls input[type=checkbox]')].map(i=>i.checked)
  })`);
  if (controls.base !== "potential" || JSON.stringify(controls.checks) !== "[false,true,true]")
    throw new Error("Independent map controls lost");
  await click("Close Esc");
  await click("Light");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await screenshot("mobile");
  const alerts = await page.evaluate(
    "[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent)"
  );
  await writeFile(
    `${output}/result.json`,
    JSON.stringify({ initial, controls, errors, alerts }, null, 2)
  );
  if (errors.length || alerts.length) throw new Error("Browser reported errors");
  console.log(JSON.stringify({ initial, controls, errors, alerts }));
} finally {
  await connection.close();
}
