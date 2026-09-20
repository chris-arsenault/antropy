import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bridge } from "./bridge";
import { WorldView } from "./WorldView";
import { initialChemicalDisplay } from "./chemicalDisplay";
import { ObservationDock } from "./ObservationDock";
import { type PanelKey } from "./observationNavigation";
import { ObservationPanels } from "./ObservationPanels";
import { RunControls, WorldStatus } from "./RunControls";
import "./observation.css";

export function Application() {
  const [bridge] = useState(() => new Bridge()),
    [message, setMessage] = useState("");
  const [chemistry, setChemistry] = useState(initialChemicalDisplay);
  const [color, setColor] = useState(3);
  const [active, setActive] = useState<PanelKey | null>(null);
  const close = useCallback(() => setActive(null), []);
  const inspect = useCallback(() => setActive("cell"), []);
  const selectPanel = useCallback((panel: PanelKey) => {
    setActive((current) => (current === panel ? null : panel));
  }, []);
  const selectChemical = useCallback((species: number) => {
    setChemistry((v) => ({ ...v, species, base: "chemical" }));
  }, []);
  const view = useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
  const error = useCallback((e: unknown) => setMessage(String(e)), []);
  const dismiss = useCallback(() => setMessage(""), []);
  const compareRole = useCallback(
    (input: number, output: number) => {
      bridge
        .call("phenotype", { action: "select", selection: { kind: "role", input, output } })
        .then(() => setActive("phenotypes"))
        .catch(error);
    },
    [bridge, error]
  );
  useVisibilitySave(bridge, error);
  return (
    <main className="application">
      <WorldView
        bridge={bridge}
        view={view}
        error={error}
        chemistry={chemistry}
        setChemistry={setChemistry}
        mapOpen={active === "map"}
        close={close}
        onInspect={inspect}
        color={color}
        setColor={setColor}
      />
      <header className="game-hud">
        <div className="brand">
          <h1>Biotropy</h1>
          <span>Living chemistry</span>
        </div>
        <WorldStatus status={view.status} />
        <RunControls bridge={bridge} status={view.status} error={error} />
      </header>
      <WorldNotices
        error={view.error || message}
        stop={view.status?.summary.stopReason ?? null}
        dismiss={view.error ? null : dismiss}
      />
      <ObservationPanels
        bridge={bridge}
        view={view}
        active={active}
        close={close}
        error={error}
        chemistry={chemistry}
        selectChemical={selectChemical}
        inspect={inspect}
        compareRole={compareRole}
        color={color}
        setColor={setColor}
      />
      <ObservationDock active={active} select={selectPanel} />
    </main>
  );
}

function WorldNotices({
  error,
  stop,
  dismiss,
}: {
  error: string | null;
  stop: string | null;
  dismiss: (() => void) | null;
}) {
  if (!error && !stop) return null;
  return (
    <div className="world-notice" role={error ? "alert" : "status"}>
      <span>{error || stop}</span>
      {error && dismiss && <button onClick={dismiss}>Dismiss</button>}
    </div>
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
