/** Serve generated build bytes only inside this CDP target; no additional HTTP server. */
import { readFile, readdir } from "node:fs/promises";
export async function useBuild(page, site) {
  const assets = new Set((await readdir("dist/assets")).map((name) => `/assets/${name}`));
  for (const name of await readdir("dist/engine-threads", { recursive: true }))
    if (/\.(js|wasm|json)$/.test(name)) assets.add(`/engine-threads/${name}`);
  assets.add("/antropy-engine.wasm");
  assets.add("/");
  page.listeners.add(async (message) => {
    if (message.method !== "Fetch.requestPaused") return;
    const requestId = message.params.requestId;
    const path = new URL(message.params.request.url).pathname;
    if (!assets.has(path)) return page.send("Fetch.continueRequest", { requestId });
    const body = await readFile(`dist${path === "/" ? "/index.html" : path}`);
    let mime = "application/wasm";
    if (path === "/") mime = "text/html";
    if (path.endsWith(".js")) mime = "text/javascript";
    if (path.endsWith(".css")) mime = "text/css";
    if (path.endsWith(".json")) mime = "application/json";
    await page.send("Fetch.fulfillRequest", {
      requestId,
      responseCode: 200,
      responseHeaders: [
        { name: "Content-Type", value: mime },
        { name: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { name: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      ],
      body: body.toString("base64"),
    });
  });
  await page.send("Fetch.enable", { patterns: [{ urlPattern: `${site}/*` }] });
}
