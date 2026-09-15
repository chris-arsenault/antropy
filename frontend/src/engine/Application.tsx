import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bridge } from "./bridge";
import { WorldView } from "./WorldView";
import { StatsPanel } from "./StatsPanel";
import { Inspector } from "./Inspector";
import { Settings } from "./Settings";
import { PersistenceControls } from "./PersistenceControls";
import { type LiveStatus } from "./types";
import { SPEEDS } from "../ui/pacing";
import { ChemicalPanel } from "./ChemicalPanel";
import { initialChemicalDisplay } from "./chemicalDisplay";

export function Application() {
  const [bridge] = useState(() => new Bridge()),
    [message, setMessage] = useState("");
  const [chemistry, setChemistry] = useState(initialChemicalDisplay);
  const selectChemical = useCallback((species: number) => {
    setChemistry((v) => ({ ...v, species, base: "chemical" }));
  }, []);
  const view = useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
  const error = useCallback((e: unknown) => setMessage(String(e)), []);
  const s = view.status,
    definition = view.definition;
  useVisibilitySave(bridge, error);
  return (
    <main>
      <header>
        <div>
          <h1>Antropy</h1>
          <p>Spatial digital chemistry · individually evolving cells</p>
        </div>
        <RunControls bridge={bridge} status={s} error={error} />
      </header>
      {(view.error || message) && <p role="alert">{view.error || message}</p>}
      <div className="workspace">
        <WorldView
          bridge={bridge}
          view={view}
          error={error}
          chemistry={chemistry}
          setChemistry={setChemistry}
        />
        <aside>
          {s && definition && (
            <>
              <ChemicalPanel
                chemicals={s.chemicals}
                definition={definition}
                selected={chemistry.species}
                select={selectChemical}
              />
              <StatsPanel status={s} definition={definition} bridge={bridge} error={error} />
              <Inspector
                bridge={bridge}
                inspection={view.inspection}
                definition={definition}
                error={error}
              />
            </>
          )}
        </aside>
      </div>
      <div className="settings">
        {definition && (
          <Settings
            key={definition.seed + ":" + JSON.stringify(definition.config)}
            bridge={bridge}
            definition={definition}
            error={error}
          />
        )}
        <PersistenceControls bridge={bridge} ready={!!s} />
      </div>
    </main>
  );
}

function useVisibilitySave(bridge: Bridge, error: (e: unknown) => void) {
  useEffect(() => {
    const save = () => {
      if (bridge.getSnapshot().status) bridge.call("save", { reason: "automatic" }).catch(error);
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", save);
    };
  }, [bridge, error]);
}

function RunControls({
  bridge,
  status: s,
  error,
}: {
  bridge: Bridge;
  status: LiveStatus | null;
  error: (e: unknown) => void;
}) {
  return (
    <div className="run-controls">
      <button
        className="primary"
        disabled={!s || !!s.summary.stopReason}
        onClick={() => {
          bridge.call("running", { value: !s?.running }).catch(error);
        }}
      >
        {s?.running ? "Pause" : "Run"}
      </button>
      <button disabled={!s || s.running} onClick={() => bridge.call("step").catch(error)}>
        Step
      </button>
      <SpeedControl bridge={bridge} status={s} error={error} />
      <span role="status">
        {s?.running ? "Running" : "Paused"} · {s?.recovery ?? "Loading chemistry engine"}
      </span>
    </div>
  );
}
function SpeedControl({
  bridge,
  status: s,
  error,
}: {
  bridge: Bridge;
  status: LiveStatus | null;
  error: (e: unknown) => void;
}) {
  return (
    <label>
      Speed{" "}
      <select
        disabled={!s}
        value={s?.speed ?? 30}
        onChange={(e) =>
          bridge
            .call("speed", {
              value: e.target.value === "max" ? "max" : Number(e.target.value),
            })
            .catch(error)
        }
      >
        {SPEEDS.map((speed) => (
          <option key={speed} value={speed}>
            {speed === "max" ? "Maximum" : `${speed} ticks/s`}
          </option>
        ))}
      </select>
    </label>
  );
}
