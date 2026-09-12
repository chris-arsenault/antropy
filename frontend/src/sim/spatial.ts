import { type Config } from "./config";
import { type Cell, type Point } from "./types";
import { wrap, distance, radius } from "./geometry";

/** Periodic spatial bins; all updates follow stable cell order. */
export class SpatialIndex {
  private readonly bins: (Cell[] | undefined)[];
  private readonly radii = new Map<Cell, number>();
  private readonly found: Cell[] = [];
  private readonly nx: number;
  private readonly ny: number;
  private largest = 0;
  constructor(
    private readonly config: Config,
    cells: readonly Cell[]
  ) {
    let size = 2;
    for (const cell of cells) {
      const r = radius(cell, config);
      this.radii.set(cell, r);
      size = Math.max(size, 2 * r);
    }
    this.nx = Math.max(1, Math.floor(config.width / size));
    this.ny = Math.max(1, Math.floor(config.height / size));
    this.bins = new Array<Cell[] | undefined>(this.nx * this.ny);
    for (const cell of cells) this.insert(cell, this.radii.get(cell)!);
  }
  private column(x: number): number {
    return Math.floor((wrap(x, this.config.width) * this.nx) / this.config.width);
  }
  private row(y: number): number {
    return Math.floor((wrap(y, this.config.height) * this.ny) / this.config.height);
  }
  private insert(cell: Cell, r: number): void {
    this.largest = Math.max(this.largest, r);
    const key = this.row(cell.y) * this.nx + this.column(cell.x);
    const bin = this.bins[key];
    if (bin) bin.push(cell);
    else this.bins[key] = [cell];
  }
  /** Body radius as of the cell's last insertion; re-add a cell after its body changes. */
  radius(cell: Cell): number {
    return this.radii.get(cell) ?? radius(cell, this.config);
  }
  add(cell: Cell): void {
    const r = radius(cell, this.config);
    this.radii.set(cell, r);
    this.insert(cell, r);
  }
  remove(cell: Cell): void {
    const bin = this.bins[this.row(cell.y) * this.nx + this.column(cell.x)];
    const at = bin ? bin.indexOf(cell) : -1;
    if (bin && at >= 0) bin.splice(at, 1);
  }
  /**
   * Cells in distinct bins around `p`, row-major in first-occurrence order. The returned array
   * is a snapshot reused by the next `near` call; finish iterating before querying again.
   */
  near(p: Point, reach = 2 * this.largest): Cell[] {
    const rx = Math.min(this.nx, Math.ceil((reach * this.nx) / this.config.width));
    const ry = Math.min(this.ny, Math.ceil((reach * this.ny) / this.config.height));
    const columns = Math.min(this.nx, 2 * rx + 1),
      rows = Math.min(this.ny, 2 * ry + 1);
    const x0 = wrap(this.column(p.x) - rx, this.nx),
      y0 = wrap(this.row(p.y) - ry, this.ny);
    const result = this.found;
    result.length = 0;
    for (let j = 0; j < rows; j++) {
      const rowOffset = ((y0 + j) % this.ny) * this.nx;
      for (let i = 0; i < columns; i++) {
        const bin = this.bins[rowOffset + ((x0 + i) % this.nx)];
        if (bin) for (let k = 0; k < bin.length; k++) result.push(bin[k]);
      }
    }
    return result;
  }
  free(p: Point, candidateRadius: number, ignore: number): boolean {
    const near = this.near(p, candidateRadius + this.largest);
    for (let i = 0; i < near.length; i++) {
      const other = near[i];
      if (other.id === ignore) continue;
      if (distance(p, other, this.config) < candidateRadius + this.radius(other)) return false;
    }
    return true;
  }
}
