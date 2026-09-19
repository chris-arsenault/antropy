import { type Bridge, type ViewState } from "./bridge";
import { type ChemicalDisplay } from "./chemicalDisplay";
import { ChemicalPanel } from "./ChemicalPanel";
import { GenealogyPanel } from "./GenealogyPanel";
import { Inspector } from "./Inspector";
import { Overlay } from "./Overlay";
import { PANELS, type PanelKey } from "./observationNavigation";
import { PersistenceControls } from "./PersistenceControls";
import { Settings } from "./Settings";
import { StatsPanel } from "./StatsPanel";
import { ChemicalWebPanel } from "./ChemicalWebPanel";

interface Props {
  bridge: Bridge;
  view: ViewState;
  active: PanelKey | null;
  chemistry: ChemicalDisplay;
  selectChemical: (species: number) => void;
  inspect: () => void;
  close: () => void;
  error: (e: unknown) => void;
  color: number;
  setColor: (color: number) => void;
}

export function ObservationPanels(props: Props) {
  const { active, view, bridge, close, error } = props;
  return (
    <>
      {active && active !== "map" && active !== "settings" && (
        <Overlay
          title={active === "web" ? "Chemical web" : PANELS[active]}
          layout={active === "web" ? "wide" : "standard"}
          open
          close={close}
        >
          <PanelContent {...props} />
        </Overlay>
      )}
      <Overlay title="Settings" layout="standard" open={active === "settings"} close={close}>
        {view.definition ? (
          <Settings
            key={view.definition.seed + ":" + JSON.stringify(view.definition.config)}
            bridge={bridge}
            definition={view.definition}
            error={error}
          />
        ) : (
          <p>Waiting for the world to load.</p>
        )}
      </Overlay>
    </>
  );
}

function PanelContent({
  active,
  view,
  bridge,
  chemistry,
  selectChemical,
  inspect,
  error,
  color,
  setColor,
}: Props) {
  const { status, definition } = view;
  if (active === "saves") return <SavePanel view={view} bridge={bridge} />;
  if (!status || !definition) return <p>Waiting for the world to load.</p>;
  switch (active) {
    case "web":
      return (
        <ChemicalWebPanel
          bridge={bridge}
          web={status.chemicalWeb}
          color={color}
          setColor={setColor}
          selectChemical={selectChemical}
          error={error}
        />
      );
    case "chemistry":
      return (
        <ChemicalPanel
          chemicals={status.chemicals}
          definition={definition}
          selected={chemistry.species}
          select={selectChemical}
        />
      );
    case "population":
      return <StatsPanel status={status} definition={definition} />;
    case "lineage":
      return <GenealogyPanel status={status} bridge={bridge} error={error} onInspect={inspect} />;
    case "cell":
      return (
        <Inspector
          bridge={bridge}
          inspection={view.inspection}
          definition={definition}
          error={error}
        />
      );
    default:
      return null;
  }
}

function SavePanel({ view, bridge }: Pick<Props, "view" | "bridge">) {
  return (
    <>
      <p role="status">{view.status?.recovery ?? "Waiting for the world to load."}</p>
      <PersistenceControls bridge={bridge} ready={!!view.status} />
    </>
  );
}
