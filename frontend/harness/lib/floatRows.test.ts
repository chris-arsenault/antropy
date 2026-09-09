import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { FloatRows } from "./floatRows";

it("preserves the previous float32 encoding across full and partial chunks", () => {
  const root = mkdtempSync(join(tmpdir(), "antropy-float-rows-"));
  try {
    const path = join(root, "rows.f32");
    const rows = [
      [0, -0, 0.1],
      [1e-12, 65535, 16777215],
      [-1.3, 7, 0.99999999],
    ];
    const writer = new FloatRows(path, 3, 2);
    for (const row of rows) writer.append(row);
    writer.close();
    writer.close();
    expect(writer.rows).toBe(3);
    expect(readFileSync(path)).toEqual(Buffer.from(Float32Array.from(rows.flat()).buffer));
    expect(() => writer.append(rows[0])).toThrow("closed");
    expect(() => new FloatRows(path, 3)).toThrow();
  } finally {
    rmSync(root, { recursive: true });
  }
});

it("rejects malformed records without adding a partial row", () => {
  const root = mkdtempSync(join(tmpdir(), "antropy-float-rows-"));
  try {
    const path = join(root, "rows.f32");
    const writer = new FloatRows(path, 3);
    expect(() => writer.append([1, 2])).toThrow("width");
    writer.close();
    expect(readFileSync(path).length).toBe(0);
    expect(() => new FloatRows(join(root, "invalid"), 0)).toThrow("width");
  } finally {
    rmSync(root, { recursive: true });
  }
});
