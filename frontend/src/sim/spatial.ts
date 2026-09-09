import { type Config } from "./config";
import { type Cell, type Point } from "./types";
import { wrap, distance, radius } from "./geometry";

/** Periodic spatial bins; all updates follow stable cell order. */
export class SpatialIndex {
  private readonly bins = new Map<number, Set<Cell>>();
  private readonly nx: number;
  private readonly ny: number;
  private largest = 0;
  constructor(
    private readonly config: Config,
    cells: readonly Cell[]
  ) {
    const size = cells.reduce((max, cell) => Math.max(max, 2 * radius(cell, config)), 2);
    this.nx = Math.max(1, Math.floor(config.width / size));
    this.ny = Math.max(1, Math.floor(config.height / size));
    for (const cell of cells) this.add(cell);
  }
  private key(p: Point): number {
    return (
      Math.floor((wrap(p.y, this.config.height) * this.ny) / this.config.height) * this.nx +
      Math.floor((wrap(p.x, this.config.width) * this.nx) / this.config.width)
    );
  }
  add(cell: Cell): void {
    this.largest = Math.max(this.largest, radius(cell, this.config));
    const key = this.key(cell);
    if (!this.bins.has(key)) this.bins.set(key, new Set());
    this.bins.get(key)!.add(cell);
  }
  remove(cell: Cell): void {
    this.bins.get(this.key(cell))?.delete(cell);
  }
  near(p: Point, reach = 2 * this.largest): Cell[] {
    const key = this.key(p),
      x = key % this.nx,
      y = Math.floor(key / this.nx),
      result = new Set<Cell>();
    const rx = Math.min(this.nx, Math.ceil((reach * this.nx) / this.config.width));
    const ry = Math.min(this.ny, Math.ceil((reach * this.ny) / this.config.height));
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++)
        for (const cell of this.bins.get(wrap(y + dy, this.ny) * this.nx + wrap(x + dx, this.nx)) ??
          [])
          result.add(cell);
    return [...result];
  }
  free(p: Point, candidateRadius: number, ignore: number): boolean {
    return this.near(p, candidateRadius + this.largest).every(
      (other) =>
        other.id === ignore ||
        distance(p, other, this.config) >= candidateRadius + radius(other, this.config)
    );
  }
}
