import { closeSync, openSync, writeSync } from "node:fs";

/** Generated float32 records, streamed without retaining a whole simulation trajectory. */
export class FloatRows {
  private readonly descriptor: number;
  private readonly buffer: Float32Array;
  private used = 0;
  private closed = false;
  rows = 0;

  constructor(
    path: string,
    readonly columns: number,
    batchRows = 4096
  ) {
    if (!Number.isSafeInteger(columns) || columns <= 0)
      throw new Error("invalid float record width");
    if (!Number.isSafeInteger(batchRows) || batchRows <= 0)
      throw new Error("invalid float record batch size");
    this.buffer = new Float32Array(columns * batchRows);
    this.descriptor = openSync(path, "wx");
  }

  append(row: readonly number[]): void {
    if (this.closed) throw new Error("float record writer is closed");
    if (row.length !== this.columns) throw new Error("float record width mismatch");
    this.buffer.set(row, this.used);
    this.used += this.columns;
    this.rows++;
    if (this.used === this.buffer.length) this.flush();
  }

  private flush(): void {
    const bytes = Buffer.from(this.buffer.buffer, 0, this.used * 4);
    let offset = 0;
    while (offset < bytes.length) {
      const written = writeSync(this.descriptor, bytes, offset, bytes.length - offset);
      if (written === 0) throw new Error("float record write made no progress");
      offset += written;
    }
    this.used = 0;
  }

  close(): void {
    if (this.closed) return;
    try {
      this.flush();
    } finally {
      closeSync(this.descriptor);
      this.closed = true;
    }
  }
}
