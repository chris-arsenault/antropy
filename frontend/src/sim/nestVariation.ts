import { createRandomState, nextRandom } from "./random";
import { type ChamberSpec, type NodeSpec } from "./nestLayouts";

interface NestSpecs {
  readonly chambers: readonly ChamberSpec[];
  readonly junctions: readonly NodeSpec[];
  readonly passages: readonly (readonly [string, string])[];
}

/** Generation only. Neither the seed nor the graph enters an actor's observation. */
export function varyNest(specs: NestSpecs, seed: number): NestSpecs {
  const random = createRandomState(seed);
  const draw = () => nextRandom(random);
  const mirror = draw() < 0.5 ? -1 : 1;
  const width = 0.7 + draw() * 0.3;
  const depth = 0.8 + draw() * 0.18;
  const position = (node: NodeSpec) => ({
    ...node,
    dx: mirror * Math.round(node.dx * width + draw() * 4 - 2),
    depth: Math.round(node.depth * depth),
  });
  const chambers = specs.chambers.map((room) => ({
    ...room,
    ...position(room),
    rx: Math.max(2, Math.round(room.rx * (0.5 + draw() * 0.5))),
    ry: Math.max(2, Math.round(room.ry * (0.6 + draw() * 0.4))),
  }));
  const junctions = specs.junctions.map(position);
  // Permuting lower room positions changes queen/cache placement and connecting passages.
  const lower = chambers.filter((room) => room.depth >= 30);
  for (let index = lower.length - 1; index > 0; index--) {
    const other = Math.floor(draw() * (index + 1));
    const a = lower[index],
      b = lower[other];
    [a.dx, b.dx] = [b.dx, a.dx];
    [a.depth, b.depth] = [b.depth, a.depth];
  }
  const passages = specs.passages.map((edge) => [...edge] as [string, string]);
  // Remove only redundant edges: topology varies while every node stays connected.
  for (let index = passages.length - 1; index >= 0; index--) {
    if (draw() >= 0.45) continue;
    const candidate = passages.filter((_, other) => other !== index);
    if (connected(candidate, 1 + chambers.length + junctions.length)) passages.splice(index, 1);
  }
  return { chambers, junctions, passages };
}

function connected(edges: readonly (readonly [string, string])[], count: number): boolean {
  const visited = new Set(["entrance"]);
  for (let pass = 0; pass < count; pass++) {
    for (const [a, b] of edges) {
      if (visited.has(a)) visited.add(b);
      if (visited.has(b)) visited.add(a);
    }
  }
  return visited.size === count;
}
