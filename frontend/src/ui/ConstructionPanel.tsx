import { useState } from "react";
import { type Point } from "../sim/geometry";
import { type World } from "../sim/types";
import { type JobKind } from "../sim/construction/state";
import { requestConstruction, cancelConstruction } from "../sim/construction/sites";

export function ConstructionPanel({
  world,
  point,
  onChange,
}: {
  readonly world: World;
  readonly point: Point;
  readonly onChange: () => void;
}) {
  const [kind, setKind] = useState<JobKind>("dig");
  const [dump, setDump] = useState<Point | null>(null);
  const [source, setSource] = useState(-3);
  const sourceId = world.caches.has(source) ? source : ([...world.caches.keys()][0] ?? null);
  const [error, setError] = useState("");
  const submit = () => {
    try {
      if (kind === "dig" && !dump)
        throw new Error("Select a disposal cell and press Set spoil destination first");
      requestConstruction(
        world,
        kind,
        point,
        dump ?? point,
        kind === "move-cache" ? sourceId : null
      );
      setError("");
      onChange();
    } catch (reason) {
      setError(String(reason instanceof Error ? reason.message : reason));
    }
  };
  return (
    <details className="construction-panel">
      <summary>Construction diagnostics · {world.construction.excavated} cells dug</summary>
      <p>
        Shift-click the map to select a cell: ({point.x}, {point.y}). Ants perform queued work when
        the simulation runs.
      </p>
      <label>
        Work{" "}
        <select value={kind} onChange={(event) => setKind(event.target.value as JobKind)}>
          <option value="dig">Dig one cell</option>
          <option value="queen">Transport queen</option>
          <option value="cache">Create cache</option>
          <option value="move-cache">Move cache food</option>
        </select>
      </label>
      {kind === "dig" && (
        <>
          <button onClick={() => setDump({ ...point })}>Set spoil destination</button>
          <span> Spoil: {dump ? `${dump.x}, ${dump.y}` : "not selected"}</span>
        </>
      )}
      {kind === "move-cache" && (
        <SourceCache world={world} source={sourceId} onSelect={setSource} />
      )}
      <button onClick={submit}>Queue at selected cell</button>
      {error && <p role="alert">{error}</p>}
      <p>
        Excavated {world.construction.excavated} · deposited spoil {world.construction.deposited} ·
        caches {world.caches.size}
      </p>
      <JobRows world={world} onChange={onChange} />
    </details>
  );
}

function SourceCache({
  world,
  source,
  onSelect,
}: {
  readonly world: World;
  readonly source: number | null;
  readonly onSelect: (id: number) => void;
}) {
  return (
    <label>
      Source cache{" "}
      <select value={source ?? ""} onChange={(event) => onSelect(Number(event.target.value))}>
        {[...world.caches].map(([id, cache]) => (
          <option key={id} value={id}>
            #{id} ({cache.x}, {cache.y})
          </option>
        ))}
      </select>
    </label>
  );
}

function JobRows({ world, onChange }: { readonly world: World; readonly onChange: () => void }) {
  return (
    <>
      {world.construction.jobs.slice(-20).map((job) => (
        <div key={job.id}>
          #{job.id} {job.kind} ({job.x}, {job.y}) · {job.origin} · {job.status} · worker{" "}
          {job.owner ?? "none"}
          {job.owner !== null &&
            ` · ${world.ants.find((ant) => ant.id === job.owner)?.decision.result}`}
          {["pending", "active"].includes(job.status) && (
            <button
              onClick={() => {
                cancelConstruction(world, job.id);
                onChange();
              }}
            >
              Cancel
            </button>
          )}
        </div>
      ))}
    </>
  );
}
