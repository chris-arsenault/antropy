import { useState } from "react";
import { type Bridge } from "./bridge";
import { type Definition, type Inspection, type CellState } from "./types";
import { ChemicalAtlas } from "./ChemicalAtlas";
import { Table, numberText as n } from "./Table";
import { CellGenealogy } from "./CellGenealogy";
import { BODY_PARTS, enzymeStock, machineryLabel } from "./bodyParts";
import { CellOrganization } from "./CellOrganization";

const MACHINERY = ["Receptor", "Transporter", "Enzyme"].flatMap((part) =>
  Array.from({ length: 4 }, (_, i) => part + " " + i)
);
const PARTS = BODY_PARTS;
const INPUTS = [
  ...Array.from({ length: 4 }, (_, i) =>
    ["level", "change", "forward", "left"].map((v) => "Receptor " + i + " " + v)
  ).flat(),
  ...MACHINERY.map((p) => "Built " + p),
  "Usable energy",
  "Growth",
  "Front contact",
  "Left contact",
  "Rear contact",
  "Right contact",
  "Task byte",
  "Built motor capacity",
  "Built storage capacity",
  "Internal inventory fill",
  "Damage",
  "Light level",
  "Light change",
  "Light front − back",
  "Light left − right",
  "Built photoreceptor capacity",
  ...Array.from({ length: 4 }, (_, i) => [
    `Inward receptor ${i} level`,
    `Inward receptor ${i} change`,
  ]).flat(),
  ...Array.from({ length: 4 }, (_, i) => `Built enzyme ${i + 4}`),
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
          {p.installedChemistry &&
            JSON.stringify(p.installedChemistry) !== JSON.stringify(p.expressed?.chemistry) && (
              <details>
                <summary>Installed machinery and inherited target</summary>
                <p>
                  Genome {p.cell.genome} supplies inherited instructions. The installed coordinates
                  below change gradually as the cell pays to refit its funded machinery.
                </p>
                <pre>{JSON.stringify(p.installedChemistry, null, 2)}</pre>
              </details>
            )}
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
          Family and ancestry · {p.genealogy.descendantCount.toLocaleString()} living descendants
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
          row.links ?? "unrelated",
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
        Usable energy {n(c.energy)} · built material {n(c.body.reduce((a, b) => a + b, 0))} ·
        internal material {n(c.inventory.material)} · damage {(100 * c.damage).toFixed(1)}%
      </p>
      <p>
        Swim {n(c.action.swim)} · turn {n(c.action.turn)} · repair {n(c.action.repair)}. Stress load{" "}
        {n(p.exposure)} · impedance {n(p.impedance)} · mobility {n(p.mobility)}.
      </p>
      <Chemistry inspection={p} definition={definition} />
      <CellOrganization inspection={p} />
      <Photoreception cell={c} />
      {p.illumination !== null && (
        <p>
          Local illumination: {n(p.illumination)}×. External work accepted this tick{" "}
          {n(c.flows.externalWork)}; zero between physiology updates.
        </p>
      )}
      {p.weathering && (
        <p>
          Chemical weathering: medium activity {n(p.weathering[0])} · exposed activity{" "}
          {n(p.weathering[1])} · attenuation {(100 * p.weathering[2]).toFixed(1)}%. Conversion also
          depends on the chemical present.
        </p>
      )}
      <details>
        <summary>Local inputs and private recurrent state</summary>
        <Table
          columns={["Input", "Value"]}
          rows={INPUTS.map((name, i) => [name, n(c.inputs[i])])}
        />
        <pre>{JSON.stringify({ hidden: c.brain.hidden, events: p.events }, null, 2)}</pre>
      </details>
      <details>
        <summary>Funded body and inherited genes</summary>
        <p>
          Genotype inherited learning change {n(p.genotype?.learned)}. Chromosomes:{" "}
          {p.genotype?.chromosomes.length}. Constructed stocks and newborn targets are separate.
        </p>
        <Table
          columns={["Stock", "Built", "Newborn target"]}
          rows={PARTS.map((part, i) => [part, n(c.body[i]), n(p.blueprint?.[i])])}
        />
        <pre>{JSON.stringify({ inherited: p.genotype, acquired: c.brain.traces }, null, 2)}</pre>
      </details>
    </>
  );
}
function transportDirection(effort: number) {
  if (effort < 0.5) return "export";
  return effort > 0.5 ? "import" : "hold";
}
function Photoreception({ cell: c }: { cell: CellState }) {
  return (
    <p>
      Photoreceptor: level {n(c.inputs[39])} · change {n(c.inputs[40])} · front − back{" "}
      {n(c.inputs[41])} · left − right {n(c.inputs[42])}. Built stock {n(c.body[15])}.
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
    genes = c.installed;
  const slots = [...genes.receptors, ...genes.transporters, ...genes.enzymes];
  const operation = (i: number) => {
    if (i < 4) return `sense · ${(100 * genes.inward[i]).toFixed(0)}% inward`;
    if (i < 8)
      return (
        transportDirection(c.action.transport[i - 4]) +
        " · effort " +
        n(Math.abs(2 * c.action.transport[i - 4] - 1))
      );
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
  };
  const species = c.inventory.amounts
    .map((inside, s) => ({ inside, s, outside: p.local![s] }))
    .filter((v) => v.inside + v.outside > 0);
  return (
    <div>
      <h3>Chemistry</h3>
      <p>
        Membrane ({n(genes.membrane.x)}, {n(genes.membrane.y)})
      </p>
      <Table
        columns={["Slot", "Installed coordinate", "Operation", "Stock"]}
        rows={slots.map((g, i) => [
          machineryLabel(i),
          n(g.x) + ", " + n(g.y),
          operation(i),
          n(c.body[i < 8 ? i + 3 : enzymeStock(i - 8)]),
        ])}
      />
      <ChemicalAtlas definition={definition} machinery={genes} />
      <details>
        <summary>Local and internal mixtures · {species.length} species</summary>
        <Table
          columns={["ID", "Inside · amount", "Outside · concentration", "U / D / I / S"]}
          rows={species.map((v) => [
            v.s,
            n(v.inside),
            n(v.outside),
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
