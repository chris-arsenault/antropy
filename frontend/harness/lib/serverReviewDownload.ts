import { createHash } from "node:crypto";
import { open } from "node:fs/promises";

export interface DownloadBudget {
  remaining: number;
  signal: AbortSignal;
}

/** Stream to a new local file; never retry credentials, redirect them, or overwrite evidence. */
export async function downloadEvidence(
  url: URL,
  token: string,
  path: string,
  budget: DownloadBudget,
  limit: number
) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "error",
    signal: budget.signal,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`GET ${url.pathname} returned HTTP ${response.status}; capture stopped`);
  }
  if (!response.body) throw new Error(`GET ${url.pathname} returned no body`);
  const reader = response.body.getReader(),
    file = await open(path, "wx").catch(async (error) => {
      await reader.cancel();
      throw error;
    }),
    hash = createHash("sha256");
  let bytes = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      budget.remaining -= chunk.value.byteLength;
      if (bytes > limit || budget.remaining < 0)
        throw new Error(`GET ${url.pathname} exceeded the capture byte budget`);
      hash.update(chunk.value);
      await file.writeFile(chunk.value);
    }
  } finally {
    await reader.cancel();
    await file.close();
  }
  return {
    route: url.pathname,
    bytes,
    sha256: hash.digest("hex"),
    tick: response.headers.get("x-biotropy-tick"),
    generation: response.headers.get("x-biotropy-generation"),
    checkpoint: response.headers.get("x-biotropy-checkpoint"),
    version: response.headers.get("x-biotropy-version"),
  };
}
