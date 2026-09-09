import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [chrome, url, output, counts = "8,2000", checkpoint] = process.argv.slice(2);
if (!chrome || !url || !output)
  throw new Error("usage: browserCapacity.mjs CHROME URL OUTPUT [COUNTS|checkpoint] [ARTIFACT]");
const profile = mkdtempSync(join(tmpdir(), "antropy-capacity-"));
const child = spawn(
  chrome,
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
const endpoint = await new Promise((resolveEndpoint, reject) => {
  child.once("error", reject);
  child.stderr.on("data", (data) => {
    const match = String(data).match(/DevTools listening on (ws:\/\/\S+)/);
    if (match) resolveEndpoint(match[1]);
  });
  child.once("exit", (code) => reject(new Error(`Chrome exited ${code}`)));
});
const socket = new WebSocket(endpoint);
await new Promise((ready, reject) => {
  socket.onopen = ready;
  socket.onerror = reject;
});
let sequence = 0;
const pending = new Map();
socket.onmessage = ({ data }) => {
  const message = JSON.parse(String(data));
  const promise = pending.get(message.id);
  if (!promise) return;
  pending.delete(message.id);
  if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
  else promise.resolve(message.result);
};
function call(method, params = {}, sessionId) {
  return new Promise((resolveCall, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: resolveCall, reject });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
try {
  const { targetId } = await call("Target.createTarget", { url });
  const { sessionId } = await call("Target.attachToTarget", { targetId, flatten: true });
  await call("Page.enable", {}, sessionId);
  await call(
    "Emulation.setDeviceMetricsOverride",
    {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    },
    sessionId
  );
  const results = [];
  const probes = ["construction", "pressures", "pacing", "checkpoint", "behavior"].includes(counts)
    ? [counts]
    : counts.split(",").map(Number);
  for (const count of probes) {
    let probe = "browserCapacity",
      invocation = `measureBrowserCapacity(${count})`;
    if (count === "behavior") {
      if (!checkpoint) throw new Error("behavior review requires a local artifact path");
      probe = "browserBehavior";
      invocation = `reviewBrowserBehavior(${JSON.stringify(checkpoint)})`;
    } else if (count === "checkpoint") {
      if (!checkpoint) throw new Error("checkpoint review requires a local artifact path");
      probe = "browserCheckpoint";
      invocation = `reviewBrowserCheckpoint(${JSON.stringify(checkpoint)})`;
    } else if (count === "pacing") {
      probe = "browserPacing";
      invocation = "reviewBrowserPacing()";
    } else if (count === "pressures") {
      probe = "browserPressures";
      invocation = "reviewBrowserPressures()";
    } else if (count === "construction") {
      probe = "browserConstruction";
      invocation = "reviewBrowserConstruction()";
    }
    const expression = `(async () => {
      const module = await import(${JSON.stringify(new URL(`/harness/lib/${probe}.ts`, url).href)});
      return module.${invocation};
    })()`;
    const response = await call(
      "Runtime.evaluate",
      { expression, awaitPromise: true, returnByValue: true },
      sessionId
    );
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    if (response.result.value.image) {
      mkdirSync(resolve(output), { recursive: true });
      writeFileSync(
        join(output, "behavior.png"),
        Buffer.from(response.result.value.image, "base64")
      );
      delete response.result.value.image;
    }
    results.push(response.result.value);
    console.log(JSON.stringify(response.result.value));
  }
  mkdirSync(resolve(output), { recursive: true });
  writeFileSync(join(output, "browser.json"), JSON.stringify(results, null, 2));
  const screenshot = await call("Page.captureScreenshot", { format: "png" }, sessionId);
  writeFileSync(join(output, "canvas.png"), Buffer.from(screenshot.data, "base64"));
} finally {
  socket.close();
  child.kill("SIGTERM");
  await new Promise((done) => child.once("exit", done));
  rmSync(profile, { recursive: true, force: true });
}
