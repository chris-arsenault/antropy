const MAX_BYTES = 16 * 1024 * 1024;
export async function decompressPublication(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (buffer.byteLength > MAX_BYTES) throw new Error("Remote packet exceeds byte bounds");
  const reader = new Blob([buffer])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("Remote scene exceeds byte bounds");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return result.buffer;
}
