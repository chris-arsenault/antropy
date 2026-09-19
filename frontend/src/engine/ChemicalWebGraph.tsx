import { useId } from "react";
import { type ChemicalWeb, type ChemicalRoute } from "./chemicalWeb";
import { identityColor } from "./genealogyHistory";

const point = (id: number) => [32 + Math.floor(id / 16) * 42, 32 + (id % 16) * 28];
function geometry(route: ChemicalRoute) {
  const [x, y] = point(route.input),
    [u, v] = point(route.output);
  const length = Math.hypot(u - x, v - y),
    dx = (u - x) / length,
    dy = (v - y) / length;
  const bend = Math.min(38, length * 0.18);
  const mx = (x + u) / 2 - dy * bend,
    my = (y + v) / 2 + dx * bend;
  return {
    path: `M ${x + dx * 9} ${y + dy * 9} Q ${mx} ${my} ${u - dx * 12} ${v - dy * 12}`,
    x: (x + u) / 2 - (dy * bend) / 2,
    y: (y + v) / 2 + (dx * bend) / 2,
  };
}

export function ChemicalWebGraph({
  web,
  focus,
}: {
  web: ChemicalWeb;
  focus: (id: number) => void;
}) {
  const marker = useId();
  const nodes = [...new Set(web.rows.flatMap((r) => [r.input, r.output]))].sort((a, b) => a - b);
  return (
    <div className="chemical-web-graph">
      <svg viewBox="0 0 694 490" role="group" aria-label="Chemical transformation web">
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#c8ddd5" />
          </marker>
        </defs>
        <g aria-hidden="true" className="web-grid">
          {Array.from({ length: 256 }, (_, id) => (
            <circle key={id} cx={point(id)[0]} cy={point(id)[1]} r="1.2" />
          ))}
        </g>
        <GraphEdges web={web} marker={marker} />
        {nodes.map((id) => (
          <ChemicalNode
            key={id}
            id={id}
            selected={web.focus === id}
            source={web.sources.includes(id)}
            focus={focus}
          />
        ))}
        <text x="32" y="482" className="web-axis">
          Chemical X → 15 · Y ↓ 15 · fixed chemical coordinates
        </text>
      </svg>
    </div>
  );
}

function ChemicalNode({
  id,
  selected,
  source,
  focus,
}: {
  id: number;
  selected: boolean;
  source: boolean;
  focus: (id: number) => void;
}) {
  const [x, y] = point(id);
  return (
    <g
      className={selected ? "web-node selected" : "web-node"}
      role="button"
      tabIndex={0}
      aria-label={`Focus chemical ${id}`}
      aria-pressed={selected}
      onClick={() => focus(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          focus(id);
        }
      }}
    >
      <title>
        Chemical {id}
        {source ? " · present in releasing reservoirs" : ""} · show its incoming and outgoing routes
      </title>
      {source && <circle cx={x} cy={y} r="12" className="web-source" />}
      <circle cx={x} cy={y} r="7" fill={identityColor(id)} />
      <text x={x} y={y - 13}>
        {id}
      </text>
    </g>
  );
}

function GraphEdges({ web, marker }: { web: ChemicalWeb; marker: string }) {
  const largest = Math.max(
    1,
    ...web.rows.map((r) => (web.mode === "primary" ? r.primary : r.cells))
  );
  return (
    <>
      {" "}
      {web.rows.map((route) => {
        const count = web.mode === "primary" ? route.primary : route.cells,
          line = geometry(route);
        return (
          <g
            key={`${route.input}-${route.output}`}
            className={web.mode === "environment" ? "web-edge environmental" : "web-edge"}
          >
            <path
              d={line.path}
              stroke={identityColor(route.input)}
              strokeWidth={1 + 3 * Math.sqrt(count / largest)}
              markerEnd={`url(#${marker})`}
            >
              <title>
                {route.input} → {route.output}
                {web.mode === "environment"
                  ? " · local-medium pathway"
                  : ` · ${route.primary} primary cells · ${route.cells} supporting cells`}
              </title>
            </path>
            {web.rows.length <= 12 && count > 0 && (
              <text x={line.x} y={line.y - 5} className="web-edge-count">
                {count} cells
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
