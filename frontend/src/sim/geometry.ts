export interface Point {
  readonly x: number;
  readonly y: number;
}

export const DIRECTIONS: readonly Point[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
] as const;

export function normalizeHeading(heading: number): number {
  return ((heading % DIRECTIONS.length) + DIRECTIONS.length) % DIRECTIONS.length;
}

export function directionAt(heading: number): Point {
  return DIRECTIONS[normalizeHeading(heading)];
}

export function stepFrom(point: Point, heading: number): Point {
  const direction = directionAt(heading);
  return { x: point.x + direction.x, y: point.y + direction.y };
}

export function headingBetween(from: Point, to: Point): number {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  const heading = DIRECTIONS.findIndex((direction) => direction.x === dx && direction.y === dy);
  if (heading < 0) throw new Error("points do not define a direction");
  return heading;
}

export function turnToward(current: number, desired: number): -1 | 0 | 1 {
  const difference = normalizeHeading(desired - current);
  if (difference === 0) return 0;
  return difference <= DIRECTIONS.length / 2 ? 1 : -1;
}

export function samePoint(left: Point, right: Point): boolean {
  return left.x === right.x && left.y === right.y;
}
