import { useState } from "react";
import { type Bridge } from "./bridge";
import { type Definition, type Inspection, type CellState } from "./types";
import { ChemicalAtlas } from "./ChemicalAtlas";
import { Table, numberText as n } from "./Table";
import { CellGenealogy } from "./CellGenealogy";
import { BODY_PARTS, enzymeStock, machineryLabel } from "./bodyParts";
import { CellOrganization } from "./CellOrganization";
import { CellControl } from "./CellControl";
import { LIGHT_INPUT, MOTOR_LOAD_INPUT } from "./controllerInputs";
import { RecognitionDetails } from "./RecognitionDetails";
import { recognitionLabel } from "./recognition";

const PARTS = BODY_PARTS;
const INPUTS = [
  ...Array.from({ length: 4 }, (_, i) =>
    ["level", "change", "forward", "left"].map((v) => "Receptor " + i + " " + v)
  ).flat(),
  ...Array.from({ length: 4 }, (_, i) => `Transporter ${i} realized activity`),
  ...Array.from({ length: 8 }, (_, i) => `Enzyme ${i} realized activity`),
  "Usable energy",
  "Growth",
  "Crowding share 1",
  "Crowding share 2",
  "Crowding share 3",
  "Crowding share 4",
  "Task byte",
  "Internal inventory fill",
  "Damage",
  "Light level",
  "Light change",
  "Light front − back",
  "Light left − right",
  ...Array.from({ length: 4 }, (_, i) => [
    `Inward receptor ${i} level`,
    `Inward receptor ${i} change`,
  ]).flat(),
  "Cover builder realized activity",
  "Light emitter realized activity",
  "Paid motor load",
  ...Array.from({ length: 9 }, (_, i) =>
    ["mean", "forward moment", "left moment"].map(
      (v) => (i === 0 ? "Hearing activity" : "Hearing bit " + (i - 1)) + " " + v
    )
  ).flat(),
  ...Array.from({ length: 4 }, (_, i) => `Strategic context ${i}`),
];
interface Props {
  bridge: Bridge;
  inspection: Inspection | null;
  definition: Definition;
  error: (e: unknown) => void;
}

export function Inspector({ bridge, inspection: p, definition, error }: Props) {
  if (!p)
    return (
      <section className="panel">
        <h2>Cell inspector</h2>
        <p>Click a cell to inspect its chemistry, funded body and inherited behavior.</p>
      </section>
    );
  return (
    <section className="panel">
      <h2>Cell {p.ancestor.id}</h2>
      <p>
        Founder ancestry {p.ancestor.lineage} · born at tick {p.ancestor.born} · {p.ancestor.cause}
      </p>
      {p.cell ? (
        <>
          <CellDetails inspection={p} definition={definition} />
          <CellControl inspection={p} bridge={bridge} error={error} />
          <p>
            Physiology is specified at birth. Activity, biomass and condition can change;
            descendants may inherit mutated capabilities.
          </p>
          {bridge.getSnapshot().status?.execution?.operator !== false && (
            <Task bridge={bridge} id={p.cell.id} error={error} />
          )}
        </>
      ) : (
        <>
          <p>
            This cell has ended. Its recorded parent and children remain available; its full private
            state is no longer retained.
          </p>
          {p.genotype && (
            <details>
              <summary>Retained inherited genome</summary>
              <pre>{JSON.stringify(p.genotype, null, 2)}</pre>
            </details>
          )}
        </>
      )}
      <details>
        <summary>
          Family and ancestry · {p.genealogy?.descendantCount.toLocaleString() ?? "unknown"}{" "}
          recorded living descendants
        </summary>
        <CellGenealogy inspection={p} bridge={bridge} error={error} />
        <Relationships inspection={p} bridge={bridge} error={error} />
      </details>
    </section>
  );
}
function Relationships({ inspection: p, bridge, error }: Omit<Props, "definition">) {
  if (!p) return null;
  const r = p.relationships;
  return (
    <details open>
      <summary>Nearest recorded relatives</summary>
      <p>
        {r.population ? ((100 * r.kin) / r.population).toFixed(1) : "0"}% of living cells share a
        recorded ancestor.
      </p>
      <Table
        columns={["Cell / family", "Ancestry links", "Physical distance", "RNN distance"]}
        rows={r.rows.map((row) => [
          <button
            key={row.cell}
            onClick={() => bridge.call("inspect", { cell: row.cell }).catch(error)}
          >
            {row.cell} / F{row.family}
          </button>,
          row.links ?? "not established in retained history",
          row.physical === null ? "genome not retained" : n(row.physical),
          row.controller === null ? "genome not retained" : n(row.controller),
        ])}
      />
      <p>
        Nearest by ancestry links. Genetic distances describe inherited differences; they do not
        measure behavior or benefit.
      </p>
    </details>
  );
}
function CellDetails({
  inspection: p,
  definition,
}: {
  inspection: Inspection;
  definition: Definition;
}) {
  const c = p.cell!;
  return (
    <>
      <p>
        Generation {c.generation} · genotype {c.genome} · task byte {c.brain.task}
      </p>
      <p>
        Usable energy {n(c.energy)} · biomass {n(c.body.reduce((a, b) => a + b, 0))} · internal
        material {n(c.inventory.material)} · damage {(100 * c.damage).toFixed(1)}%
      </p>
      <p>
        Swim {n(c.action.swim)} · turn {n(c.action.turn)} · repair {n(c.action.repair)}. Stress load{" "}
        {n(p.exposure)} · impedance {n(p.impedance)} · mobility {n(p.mobility)}.
      </p>
      <Chemistry inspection={p} definition={definition} />
      <CellOrganization inspection={p} />
      <Photoreception cell={c} />
      {p.terrain && (
        <p>
          Terrain height {n(p.terrain.height)} · grade {n(p.terrain.slope)} · conductance{" "}
          {n(p.terrain.conductance)}. Local supply clock {n(p.terrain.supplyMultiplier)}× · seasonal
          amplitude {n(p.terrain.seasonAmplitude)}. Paid motor load {n(c.inputs[MOTOR_LOAD_INPUT])}.
        </p>
      )}
      {p.optics && (
        <p>
          Sunlight {n(p.optics.solar)}× · emitted light {n(p.optics.emitted)}×. Terrain transmission{" "}
          {n(100 * p.optics.terrainTransmission)}% · film transmission{" "}
          {n(100 * p.optics.coverTransmission)}%. Paid emitter power {n(p.optics.paidPower)} work /
          time at the last optical update.
        </p>
      )}
      {p.illumination !== null && (
        <p>
          Local illumination: {n(p.illumination)}×. External work accepted this tick{" "}
          {n(c.flows.externalWork)}; zero between physiology updates.
        </p>
      )}
      {p.weathering && (
        <p>
          Chemical weathering: medium activity {n(p.weathering[0])} · photochemical activity{" "}
          {n(p.weathering[1])} · attenuation {(100 * p.weathering[2]).toFixed(1)}%. Conversion also
          depends on the chemical present.
        </p>
      )}
      <LocalInputs inspection={p} cell={c} />
      <details>
        <summary>Physiology and inherited genes</summary>
        <p>
          Genotype inherited learning change {n(p.genotype?.learned)}. Chromosomes:{" "}
          {p.genotype?.chromosomes.length}. Body proportions follow genetics at the current biomass.
        </p>
        <Table
          columns={["Component", "Current capacity", "Genetic reference"]}
          rows={PARTS.map((part, i) => [part, n(c.body[i]), n(p.blueprint?.[i])])}
        />
        <pre>{JSON.stringify({ inherited: p.genotype, acquired: c.brain.traces }, null, 2)}</pre>
      </details>
    </>
  );
}
function LocalInputs({ inspection: p, cell: c }: { inspection: Inspection; cell: CellState }) {
  return (
    <details>
      <summary>Local inputs and private recurrent state</summary>
      <Table
        columns={["Input", "Value"]}
        rows={INPUTS.map((name, i) => [
          name,
          n(i >= 52 && i < 79 ? p.control?.hearing[i - 52] : c.inputs[i]),
        ])}
      />
      <pre>{JSON.stringify({ hidden: c.brain.hidden, events: p.events }, null, 2)}</pre>
    </details>
  );
}
function transportDirection(effort: number) {
  if (effort < 0.5) return "export";
  return effort > 0.5 ? "import" : "hold";
}
function Photoreception({ cell: c }: { cell: CellState }) {
  return (
    <p>
      Photoreceptor: level {n(c.inputs[LIGHT_INPUT])} · change {n(c.inputs[LIGHT_INPUT + 1])} ·
      front − back {n(c.inputs[LIGHT_INPUT + 2])} · left − right {n(c.inputs[LIGHT_INPUT + 3])}.
      Capacity {n(c.body[15])}.
    </p>
  );
}
function Chemistry({
  inspection: p,
  definition,
}: {
  inspection: Inspection;
  definition: Definition;
}) {
  const c = p.cell!,
    genes = p.expressed!.chemistry;
  const slots = [...genes.receptors, ...genes.transporters, ...genes.enzymes];
  const species = c.inventory.amounts
    .map((inside, s) => ({ inside, s, outside: p.local![s], cover: p.coverLocal?.[s] ?? 0 }))
    .filter((v) => v.inside + v.outside + v.cover > 0);
  return (
    <div>
      <h3>Chemistry</h3>
      <p>Membrane recognition: {recognitionLabel(p.recognition, 16)}</p>
      <Table
        columns={["Slot", "Birth recognition", "Operation", "Stock"]}
        rows={slots.map((_g, i) => [
          machineryLabel(i),
          recognitionLabel(p.recognition, i),
          chemistryOperation(p, i),
          n(c.body[i < 8 ? i + 3 : enzymeStock(i - 8)]),
        ])}
      />
      {p.recognition && <RecognitionDetails profile={p.recognition} />}
      <ChemicalAtlas
        definition={definition}
        machinery={genes}
        recognition={p.recognition ?? null}
      />
      <details>
        <summary>Local and internal mixtures · {species.length} species</summary>
        <Table
          columns={[
            "ID",
            "Inside · amount",
            "Dissolved / area",
            "Film / area",
            "Susceptibility",
            "U / D / I / S",
          ]}
          rows={species.map((v) => [
            v.s,
            n(v.inside),
            n(v.outside),
            n(v.cover),
            n(p.recognition?.susceptibility[v.s]),
            (["potential", "diffusion", "impedance", "stress"] as const)
              .map((key) => n(definition.chemistry.properties[v.s][key]))
              .join(" / "),
          ])}
        />
      </details>
      <Transfers cell={c} />
    </div>
  );
}
function chemistryOperation(p: Inspection, i: number) {
  const genes = p.expressed!.chemistry;
  if (i < 4) return `sense · ${(100 * genes.inward[i]).toFixed(0)}% inward`;
  if (i < 8) {
    const effort = p.cell!.action.transport[i - 4];
    return transportDirection(effort) + " · effort " + n(Math.abs(2 * effort - 1));
  }
  const e = genes.enzymes[i - 8];
  return (
    "reflection center " +
    n(e.centerX) +
    ", " +
    n(e.centerY) +
    " · orientation " +
    n((e.angle * 180) / Math.PI) +
    "°"
  );
}
function Transfers({ cell }: { cell: CellState }) {
  const columns = ["imported", "exported", "consumed", "produced"] as const;
  const species = cell.chemicalFlows.imported
    .map((_, s) => s)
    .filter((s) => columns.some((key) => cell.chemicalFlows[key][s] > 0));
  return (
    <details>
      <summary>Cumulative chemical flows · this cell’s lifetime</summary>
      <Table
        columns={["ID", ...columns]}
        rows={species.map((s) => [s, ...columns.map((key) => n(cell.chemicalFlows[key][s]))])}
      />
    </details>
  );
}
function Task({ bridge, id, error }: { bridge: Bridge; id: number; error: (e: unknown) => void }) {
  const [value, setValue] = useState(0);
  return (
    <details>
      <summary>Diagnostic task override</summary>
      <label>
        Byte{" "}
        <input
          type="number"
          min="0"
          max="255"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </label>
      <button onClick={() => bridge.call("task", { cell: id, value }).catch(error)}>
        Set byte
      </button>
      <p>Overrides are recorded as manual interventions.</p>
    </details>
  );
}
