import { browserReplyLimit, checkBrowserCommand } from "./ownership";

interface EngineExports {
  memory: WebAssembly.Memory;
  antropy_allocate(length: number): number;
  antropy_free(pointer: number, length: number): void;
  antropy_request(pointer: number, length: number): number;
  antropy_restore(pointer: number, length: number): number;
  antropy_reply_pointer(): number;
  antropy_reply_length(): number;
  antropy_step(handle: number, count: number): number;
  antropy_render(
    handle: number,
    kind: number,
    species: number,
    color: number,
    field: number,
    selected: number
  ): number;
}
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** A complete world lives behind a versioned command boundary; no shared struct layout. */
export class Engine {
  private constructor(
    private readonly exports: EngineExports,
    readonly sourceDigest: string,
    private readonly browser: boolean
  ) {}

  static async load(bytes: Uint8Array<ArrayBuffer>, browser = false) {
    const module = await WebAssembly.instantiate(bytes, {
      env: { antropy_clock: () => performance.now() },
    });
    const sections = WebAssembly.Module.customSections(module.module, "antropy.source");
    const digest = sections.length === 1 ? decoder.decode(sections[0]) : "unidentified";
    return new Engine(module.instance.exports as unknown as EngineExports, digest, browser);
  }

  private invoke<T>(
    bytes: Uint8Array,
    consume: (reply: Uint8Array<ArrayBuffer>) => T,
    restore = false
  ): T {
    const api = this.exports;
    const pointer = api.antropy_allocate(bytes.length);
    try {
      new Uint8Array(api.memory.buffer, pointer, bytes.length).set(bytes);
      const ok = restore
        ? api.antropy_restore(pointer, bytes.length)
        : api.antropy_request(pointer, bytes.length);
      const reply = new Uint8Array(
        api.memory.buffer,
        api.antropy_reply_pointer(),
        api.antropy_reply_length()
      );
      if (!ok) throw new Error((JSON.parse(decoder.decode(reply)) as { error: string }).error);
      return consume(reply);
    } finally {
      api.antropy_free(pointer, bytes.length);
    }
  }

  command<T>(op: string, payload: Record<string, unknown> = {}): T {
    if (this.browser) checkBrowserCommand(op, payload);
    return this.invoke(encoder.encode(JSON.stringify({ ...payload, op })), (reply) => {
      if (this.browser && reply.byteLength > browserReplyLimit(op))
        throw new Error(`Data ownership reply budget exceeded: ${op}`);
      return JSON.parse(decoder.decode(reply)) as T;
    });
  }

  create(seed = 27, config: Record<string, unknown> = {}) {
    const { handle } = this.command<{ handle: number }>("create", { seed, config });
    return new EngineWorld(this, handle);
  }

  diagnostic(name: string, parameters: Record<string, unknown> = {}) {
    const { handle } = this.command<{ handle: number }>("create", {
      diagnostic: { ...parameters, name },
    });
    return new EngineWorld(this, handle);
  }

  restore(bytes: Uint8Array) {
    const { handle } = this.invoke(
      bytes,
      (reply) => JSON.parse(decoder.decode(reply)) as { handle: number },
      true
    );
    return new EngineWorld(this, handle);
  }

  snapshot(handle: number) {
    // Persistence owns its bytes across asynchronous compression and subsequent engine calls.
    return this.invoke(encoder.encode(JSON.stringify({ op: "save", handle })), (reply) =>
      reply.slice()
    );
  }

  step(handle: number, count: number) {
    if (!Number.isInteger(count) || count < 0 || count > 10000)
      throw new Error("Step batch must be an integer from 0 to 10000");
    const tick = this.exports.antropy_step(handle, count);
    if (!Number.isFinite(tick)) throw new Error("Invalid scalar step request");
    return tick < 0
      ? this.command<{ tick: number; stopReason: string | null }>("stepStatus", { handle })
      : { tick, stopReason: null };
  }

  get memoryBytes() {
    return this.exports.memory.buffer.byteLength;
  }

  /** Borrowed views: use synchronously, before any further engine call or memory growth. */
  render(
    handle: number,
    kind: number,
    species: number,
    color: number,
    field: boolean,
    selected: number
  ) {
    const pointer = this.exports.antropy_render(
      handle,
      kind,
      species,
      color,
      Number(field),
      selected
    );
    if (!pointer) throw new Error("Invalid render request");
    const memory = this.exports.memory.buffer;
    const d = new Uint32Array(memory, pointer, 13);
    if (d[0] !== 2) throw new Error("Incompatible render layout");
    return {
      cells: new Float32Array(memory, d[2], d[3]),
      field: new Float32Array(memory, d[4], d[5]),
      markers: new Float32Array(memory, d[10], d[11]),
      markerCount: d[12],
      count: d[1],
      nx: d[6],
      ny: d[7],
      tick: d[8] + d[9] * 4294967296,
    };
  }
}

export class EngineWorld {
  private disposed = false;
  constructor(
    private readonly engine: Engine,
    readonly handle: number
  ) {}

  get sourceDigest() {
    return this.engine.sourceDigest;
  }

  command<T>(op: string, payload: Record<string, unknown> = {}): T {
    if (this.disposed) throw new Error("World has been disposed");
    return this.engine.command<T>(op, { ...payload, handle: this.handle });
  }

  step(count = 1) {
    if (this.disposed) throw new Error("World has been disposed");
    return this.engine.step(this.handle, count);
  }
  render(kind = 0, species = 0, color = 0, field = true, selected = 0) {
    if (this.disposed) throw new Error("World has been disposed");
    return this.engine.render(this.handle, kind, species, color, field, selected);
  }
  snapshot() {
    if (this.disposed) throw new Error("World has been disposed");
    return this.engine.snapshot(this.handle);
  }
  dispose() {
    this.command("dispose");
    this.disposed = true;
  }
}
