export interface ExecutionMode {
  mode: "browser1" | "browser4" | "server";
  endpoint: string;
}
let defaults: ExecutionMode = { mode: "browser1", endpoint: "" };

export async function loadExecutionDefaults() {
  const response = await fetch("/execution.json", {
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return;
  const config = (await response.json()) as ExecutionMode;
  if (config.mode === "server" && typeof config.endpoint === "string") defaults = config;
}

/** URL selection starts a fresh executor. It never transfers a running world. */
export function executionMode(url = new URL(location.href)): ExecutionMode {
  const value = url.searchParams.get("execution");
  const endpoint = url.searchParams.get("server") ?? defaults.endpoint;
  const mode =
    value === "server" || value === "browser4" || value === "browser1" ? value : defaults.mode;
  return { mode, endpoint };
}

export function remoteEndpoint(value: string) {
  const url = new URL(value, location.href);
  if (url.protocol === "http:") url.protocol = "ws:";
  if (url.protocol === "https:") url.protocol = "wss:";
  if (!["ws:", "wss:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Server address must be an HTTP or WebSocket URL without credentials");
  if (location.protocol === "https:" && url.protocol !== "wss:")
    throw new Error("An HTTPS page requires a secure server connection");
  if (url.pathname === "/") url.pathname = "/stream";
  return url.href;
}
