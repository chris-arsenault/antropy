import { type Ancestor } from "./types";

const PAGE_SIZE = 2048;
const FIELDS = 6;
const CAUSES: Ancestor["cause"][] = ["alive", "division", "starvation", "damage", "disturbance"];
export interface PackedAncestry {
  encoding: "ancestry-f64-v1";
  pages: [number, string][];
  active: Ancestor[];
  count: number;
}

/** Closed lifetimes are numeric pages; living/recent records remain mutable objects. No parentage is dropped. */
export class AncestryStore implements Map<number, Ancestor> {
  readonly [Symbol.toStringTag] = "AncestryStore";
  private active = new Map<number, Ancestor>();
  private pages = new Map<number, Float64Array>();
  private encoded = new Map<number, string>();
  size = 0;
  private upper = 0;
  get hasPages(): boolean {
    return this.pages.size > 0;
  }

  constructor(records: Iterable<readonly [number, Ancestor]> = []) {
    for (const [id, record] of records) this.set(id, record);
  }
  get(id: number): Ancestor | undefined {
    const active = this.active.get(id);
    if (active) return active;
    const page = this.pages.get(Math.floor(id / PAGE_SIZE));
    const i = (id % PAGE_SIZE) * FIELDS;
    if (!page || page[i + 1] === 0) return undefined;
    return Object.freeze({
      id,
      parent: page[i] || null,
      lineage: page[i + 1],
      genome: page[i + 2],
      born: page[i + 3],
      ended: page[i + 4],
      cause: CAUSES[page[i + 5]],
    });
  }
  has(id: number): boolean {
    return this.get(id) !== undefined;
  }
  set(id: number, record: Ancestor): this {
    if (!Number.isSafeInteger(id) || id < 1 || id > 5000000 || record.id !== id)
      throw new Error("Invalid ancestry identity");
    if (!this.has(id)) this.size++;
    const page = this.pages.get(Math.floor(id / PAGE_SIZE));
    if (page) page[(id % PAGE_SIZE) * FIELDS + 1] = 0;
    this.encoded.delete(Math.floor(id / PAGE_SIZE));
    this.active.set(id, record);
    this.upper = Math.max(this.upper, id + 1);
    return this;
  }
  delete(id: number): boolean {
    if (!this.has(id)) return false;
    this.active.delete(id);
    const page = this.pages.get(Math.floor(id / PAGE_SIZE));
    if (page) page[(id % PAGE_SIZE) * FIELDS + 1] = 0;
    this.encoded.delete(Math.floor(id / PAGE_SIZE));
    this.size--;
    return true;
  }
  clear(): void {
    this.active.clear();
    this.pages.clear();
    this.encoded.clear();
    this.size = 0;
    this.upper = 0;
  }
  *entries(): MapIterator<[number, Ancestor]> {
    for (let id = 1; id < this.upper; id++) {
      const record = this.get(id);
      if (record) yield [id, record];
    }
  }
  *keys(): MapIterator<number> {
    for (const [id] of this.entries()) yield id;
  }
  *values(): MapIterator<Ancestor> {
    for (const [, record] of this.entries()) yield record;
  }
  [Symbol.iterator] = (): MapIterator<[number, Ancestor]> => this.entries();
  forEach(
    callback: (value: Ancestor, key: number, map: Map<number, Ancestor>) => void,
    thisArg?: unknown
  ): void {
    for (const [id, record] of this) callback.call(thisArg, record, id, this);
  }
  compact(): void {
    for (const [id, record] of this.active) {
      if (record.ended === null || id >= this.upper - PAGE_SIZE) continue;
      const key = Math.floor(id / PAGE_SIZE);
      let page = this.pages.get(key);
      if (!page) {
        page = new Float64Array(PAGE_SIZE * FIELDS);
        this.pages.set(key, page);
      }
      page.set(
        [
          record.parent ?? 0,
          record.lineage,
          record.genome,
          record.born,
          record.ended,
          CAUSES.indexOf(record.cause),
        ],
        (id % PAGE_SIZE) * FIELDS
      );
      this.encoded.delete(key);
      this.active.delete(id);
    }
  }
  packed(): PackedAncestry {
    return {
      encoding: "ancestry-f64-v1",
      count: this.size,
      pages: [...this.pages]
        .sort((a, b) => a[0] - b[0])
        .map(([id, page]) => [id, this.encodedPage(id, page)]),
      active: [...this.active.values()],
    };
  }
  private encodedPage(id: number, page: Float64Array): string {
    let value = this.encoded.get(id);
    if (value === undefined) {
      value = encodePage(page);
      this.encoded.set(id, value);
    }
    return value;
  }
  static unpack(data: PackedAncestry): AncestryStore {
    const store = new AncestryStore();
    for (const [key, encoded] of data.pages) {
      if (!Number.isSafeInteger(key) || key < 0 || key > 2441 || store.pages.has(key))
        throw new Error("Invalid ancestry page ID");
      store.pages.set(key, decodePage(encoded));
      store.encoded.set(key, encoded);
      store.upper = Math.max(store.upper, (key + 1) * PAGE_SIZE);
    }
    for (const record of store.values()) {
      validateClosed(record);
      store.size++;
    }
    for (const record of data.active) {
      if (store.has(record.id)) throw new Error("Duplicate ancestry identity");
      store.set(record.id, record);
    }
    if (store.size !== data.count) throw new Error("Invalid ancestry count");
    return store;
  }
}
function validateClosed(record: Ancestor): void {
  if (
    !record.id ||
    !Number.isSafeInteger(record.lineage) ||
    !record.cause ||
    record.cause === "alive"
  )
    throw new Error("Invalid closed ancestry page");
}
function encodePage(page: Float64Array): string {
  const bytes = new Uint8Array(page.length * 8),
    view = new DataView(bytes.buffer);
  page.forEach((value, i) => view.setFloat64(i * 8, value, true));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 4096)
    binary += String.fromCharCode(...bytes.subarray(i, i + 4096));
  return btoa(binary);
}
function decodePage(encoded: string): Float64Array {
  const binary = atob(encoded);
  if (binary.length !== PAGE_SIZE * FIELDS * 8) throw new Error("Invalid ancestry page size");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  const result = new Float64Array(PAGE_SIZE * FIELDS);
  for (let i = 0; i < result.length; i++) result[i] = view.getFloat64(i * 8, true);
  return result;
}
export function decodeAncestry(data: Ancestor[] | PackedAncestry): Map<number, Ancestor> {
  if (Array.isArray(data)) return new AncestryStore(data.map((a) => [a.id, a]));
  if (
    !data ||
    data.encoding !== "ancestry-f64-v1" ||
    !Array.isArray(data.pages) ||
    !Array.isArray(data.active) ||
    data.pages.length > 2442 ||
    !Number.isSafeInteger(data.count) ||
    data.count < 0 ||
    data.count > 5000000
  )
    throw new Error("Invalid ancestry encoding");
  return AncestryStore.unpack(data);
}
