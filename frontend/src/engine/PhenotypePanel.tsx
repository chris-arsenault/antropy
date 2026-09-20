import { useCallback, useEffect, useState } from "react";
import { type Bridge } from "./bridge";
import { type LiveStatus } from "./types";
import { type PhenotypeSelection, type PhenotypeReport, selectionLabel } from "./phenotypes";
import { GroupComparison } from "./PhenotypeComparison";
import { PhenotypeHistory } from "./PhenotypeHistory";
import { MaterialActivity, WindowLabel } from "./ActivityView";
import "./phenotypes.css";

interface Props {
  bridge: Bridge;
  status: LiveStatus;
  error: (e: unknown) => void;
}
export function PhenotypePanel({ bridge, status, error }: Props) {
  useEffect(() => {
    bridge.call("phenotype", { action: "panel", enabled: true }).catch(error);
    return () => {
      bridge.call("phenotype", { action: "panel", enabled: false }).catch(error);
    };
  }, [bridge, error]);
  const report = status.phenotype;
  const change = useCallback(
    (payload: Record<string, unknown>) => bridge.call("phenotype", payload).catch(error),
    [bridge, error]
  );
  if (!report) return <p role="status">Reading phenotype groups…</p>;
  return (
    <section className="phenotype-panel">
      <p>
        Compare built bodies, inherited targets and recent chemical activity. Chemical roles
        describe installed enzymes; they are not species or evidence of a feeding relationship.
      </p>
      <GroupFilter report={report} regions={status.regions} change={change} />
      <div className="web-controls">
        <button
          aria-pressed={report.highlight}
          onClick={() => change({ action: "highlight", enabled: !report.highlight })}
        >
          {report.highlight ? "Clear group highlight" : "Highlight selected group"}
        </button>
        <button
          disabled={!!report.pin || report.groups[1].count === 0}
          onClick={() => change({ action: "pin" })}
        >
          Pin selected descendants
        </button>
        {report.pin && <button onClick={() => change({ action: "unpin" })}>Remove pin</button>}
      </div>
      {report.pin && (
        <p className="pin-label">
          Pinned: {report.pin.label} · {report.pin.roots.toLocaleString()} cells at tick{" "}
          {report.pin.started.toLocaleString()}. Tracking all living descendants, including changed
          roles.
        </p>
      )}
      <GroupComparison report={report} />
      <WindowLabel window={report.window} />
      <h3>Selected group material flow</h3>
      <MaterialActivity activity={report.groups[1].activity} seconds={report.window.seconds} />
      {report.pin && <PhenotypeHistory history={status.history} pin={report.pin} />}
    </section>
  );
}

type Change = (payload: Record<string, unknown>) => void;
function GroupFilter({
  report,
  regions,
  change,
}: {
  report: PhenotypeReport;
  regions: LiveStatus["regions"];
  change: Change;
}) {
  const select = useCallback(
    (selection: PhenotypeSelection) => change({ action: "select", selection }),
    [change]
  );
  const selectedRegion = report.selection.kind === "region" ? report.selection.id : "";
  return (
    <div className="group-filter">
      <h3>{selectionLabel(report.selection)}</h3>
      <div className="web-controls">
        <button onClick={() => select({ kind: "all" })}>Whole population</button>
        <button disabled={!report.pin} onClick={() => select({ kind: "pin" })}>
          Pinned descendants
        </button>
        <label>
          Spatial region{" "}
          <select
            value={selectedRegion}
            onChange={(e) => select({ kind: "region", id: Number(e.target.value) })}
          >
            <option value="" disabled>
              Select region
            </option>
            {selectedRegion !== "" && !regions.some((r) => r.id === selectedRegion) && (
              <option value={selectedRegion}>Region {selectedRegion} · dissolved</option>
            )}
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                Region {r.id} · {r.count} cells
              </option>
            ))}
          </select>
        </label>
        <RoleFilter
          key={JSON.stringify(report.selection)}
          selection={report.selection}
          select={select}
        />
      </div>
      <p className="web-caption">
        Regions use the latest spatial census. Pin a region to follow its descendants after
        dispersal.
      </p>
    </div>
  );
}

function RoleFilter({
  select,
  selection,
}: {
  select: (s: PhenotypeSelection) => void;
  selection: PhenotypeSelection;
}) {
  const role = selection.kind === "role" ? selection : { input: 0, output: 0 };
  const [input, setInput] = useState(role.input),
    [output, setOutput] = useState(role.output);
  return (
    <form
      className="role-filter"
      onSubmit={(e) => {
        e.preventDefault();
        select({ kind: "role", input, output });
      }}
    >
      <label>
        Input{" "}
        <input
          type="number"
          min="0"
          max="255"
          step="1"
          value={input}
          onChange={(e) => setInput(Number(e.target.value))}
        />
      </label>
      <label>
        Output{" "}
        <input
          type="number"
          min="0"
          max="255"
          step="1"
          value={output}
          onChange={(e) => setOutput(Number(e.target.value))}
        />
      </label>
      <button type="submit">Compare primary role</button>
    </form>
  );
}

export function GroupHighlight({
  bridge,
  status,
  error,
}: {
  bridge: Bridge;
  status: LiveStatus | null;
  error: (e: unknown) => void;
}) {
  const report = status?.phenotype;
  if (!report?.highlight) return null;
  return (
    <div className="group-highlight">
      <span>{selectionLabel(report.selection)}</span>
      <button
        onClick={() =>
          bridge.call("phenotype", { action: "highlight", enabled: false }).catch(error)
        }
      >
        Clear highlight
      </button>
    </div>
  );
}
