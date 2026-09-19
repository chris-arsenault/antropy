import { PANELS, type PanelKey } from "./observationNavigation";

export function ObservationDock({
  active,
  select,
}: {
  active: PanelKey | null;
  select: (panel: PanelKey) => void;
}) {
  return (
    <nav className="observation-dock" aria-label="Observation tools">
      {(Object.keys(PANELS) as PanelKey[]).map((key) => (
        <button key={key} aria-pressed={active === key} onClick={() => select(key)}>
          {PANELS[key]}
        </button>
      ))}
    </nav>
  );
}
