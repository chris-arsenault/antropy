import { type Inspection } from "./types";
import { enzymeStock } from "./bodyParts";
import { Table, numberText as n } from "./Table";

const PROGRAM_COLUMNS = ["Program", "State", "Capacity", "Activity"];

export function CellOrganization({ inspection }: { inspection: Inspection }) {
  const cell = inspection.cell;
  if (!cell || !inspection.expressed) return null;
  const active = inspection.expressed.chemistry.programs.filter(Boolean).length;
  const records = inspection.expressed.chemistry.programs
    .map((program, slot) => ({
      program,
      slot,
      stock: cell.body[enzymeStock(slot)],
    }))
    .filter((record) => record.program || record.stock > 0);
  return (
    <details open>
      <summary>Cellular organization · {active} enzyme programs</summary>
      <p>
        Genes determine physiology at the current biomass. Retained free and bound chemistry changes
        processing rates; the controller chooses which reactions to run.
      </p>
      <Table
        columns={PROGRAM_COLUMNS}
        rows={records.map(({ program, slot, stock }) => [
          slot,
          program ? "active" : "absent",
          n(stock),
          program ? n(cell.action.activity[slot]) : "0",
        ])}
      />
      <p>
        Last tick: biomass gained {n(cell.flows.grown)}; growth work {n(cell.flows.growth)}.
      </p>
      <p>
        Field-facing interface {n((inspection.fieldInterface ?? 1) * 100)}%. Contact material:
        received {n(cell.flows.contactImported)}, lost {n(cell.flows.contactLost)} this tick. Direct
        uptake requires an injured neighbor; ordinary export enters the public field.
      </p>
      <p>
        Cover effort {n(cell.action.cover)} (positive deposits, negative recovers). This tick:
        deposited {n(cell.flows.coverDeposited)}, recovered {n(cell.flows.coverRecovered)} material;
        work {n(cell.flows.coverWork)}. Emission effort {n(cell.action.emission)}; paid{" "}
        {n(cell.flows.emission)} work, recovered optical work {n(cell.flows.recycledWork)}. Zero
        between physiology updates.
      </p>
    </details>
  );
}
