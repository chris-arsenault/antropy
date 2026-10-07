/** Sparse bitwise changes preserve native f32 values exactly, without GPU-shaped packets. */
export class SceneReader {
  at: number;
  private readonly bytes: Uint8Array;
  constructor(buffer: ArrayBuffer, start: number) {
    this.bytes = new Uint8Array(buffer);
    this.at = start;
  }
  integer(max = Number.MAX_SAFE_INTEGER) {
    let value = 0,
      factor = 1;
    for (let i = 0; i < 8; i++) {
      const b = this.bytes[this.at++];
      if (b === undefined) throw new Error("Truncated scene update");
      value += (b & 127) * factor;
      if (value > max || !Number.isSafeInteger(value)) throw new Error("Invalid scene integer");
      if (b < 128) return value;
      factor *= 128;
    }
    throw new Error("Invalid scene integer");
  }
  records(records: Map<number, Uint32Array>, attributes: number) {
    const count = this.integer(350000),
      fullMask = 2 ** attributes - 1;
    let id = 0;
    for (let n = 0; n < count; n++) {
      const offset = this.integer();
      if (n > 0 && offset === 0) throw new Error("Duplicate scene record");
      id += offset;
      if (!Number.isSafeInteger(id)) throw new Error("Invalid scene identity");
      const mask = this.integer(fullMask),
        old = records.get(id);
      if (!old && mask !== fullMask) throw new Error("Missing organism baseline");
      const values = old ?? new Uint32Array(attributes);
      this.attributes(values, mask);
      records.set(id, values);
    }
    this.remove(records);
    if (records.size > 350000) throw new Error("Remote scene exceeds record bounds");
  }
  private attributes(values: Uint32Array, mask: number) {
    for (let i = 0; i < values.length; i++)
      if (mask & (1 << i)) values[i] ^= this.integer(0xffffffff);
  }
  private remove(records: Map<number, Uint32Array>) {
    const count = this.integer(records.size);
    let id = 0;
    for (let n = 0; n < count; n++) {
      id += this.integer();
      if (!records.delete(id)) throw new Error("Missing removed scene record");
    }
  }
  environment(values: Uint32Array) {
    const count = this.integer(values.length);
    let index = 0;
    for (let n = 0; n < count; n++) {
      const offset = this.integer(values.length);
      if (n > 0 && offset === 0) throw new Error("Duplicate environment sample");
      index += offset;
      if (index >= values.length) throw new Error("Invalid environment sample");
      values[index] ^= this.integer(0xffffffff);
    }
  }
  finish() {
    if (this.at !== this.bytes.length) throw new Error("Trailing scene data");
  }
}
