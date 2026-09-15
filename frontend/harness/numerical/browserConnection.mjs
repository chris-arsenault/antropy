/** Local Chromium/CDP runner; uses an existing site and an isolated temporary profile. */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class Connection {
  next = 0;
  pending = new Map();
  listeners = new Set();
  constructor(socket) {
    this.socket = socket;
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const p = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) p?.reject(new Error(JSON.stringify(message.error)));
        else p?.resolve(message.result);
      } else this.listeners.forEach((fn) => fn(message));
    });
  }
  static async open(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new Connection(socket);
  }
  send(method, params = {}, sessionId) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
}

export async function launch(executable, site, isolated = false, blank = false) {
  const profile = await mkdtemp(join(tmpdir(), "antropy-browser-"));
  const child = spawn(
    executable,
    [
      "--headless",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  const address = await new Promise((resolve, reject) => {
    let log = "";
    child.stderr.on("data", (data) => {
      log = (log + data).slice(-8192);
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Chromium exited ${code}: ${log}`)));
  });
  const browser = await Connection.open(address);
  const { targetId } = await browser.send("Target.createTarget", {
    url: isolated || blank ? "about:blank" : site,
  });
  const endpoint = new URL(address);
  const tabs = await (await fetch(`http://${endpoint.host}/json/list`)).json();
  const page = await Connection.open(tabs.find((tab) => tab.id === targetId).webSocketDebuggerUrl);
  await page.send("Runtime.enable");
  if (isolated) {
    // The operational fixture must survive Vite hot reloads without altering the app server.
    const url = `${site}/__antropy_operational_fixture`;
    page.listeners.add((message) => {
      if (message.method === "Fetch.requestPaused")
        return page.send("Fetch.fulfillRequest", {
          requestId: message.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "text/html" }],
          body: Buffer.from(
            "<!doctype html><title>Local Antropy operational fixture</title>"
          ).toString("base64"),
        });
    });
    await page.send("Fetch.enable", { patterns: [{ urlPattern: url, resourceType: "Document" }] });
    await page.send("Page.navigate", { url });
  }
  await page.send("Page.bringToFront");
  return {
    browser,
    page,
    async close() {
      page.socket.close();
      await browser.send("Browser.close").catch(() => {});
      browser.socket.close();
      child.kill();
      await rm(profile, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}
