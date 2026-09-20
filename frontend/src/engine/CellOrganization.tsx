import { type Inspection } from "./types";
import { BODY_PARTS, enzymeStock } from "./bodyParts";
import { Table, numberText as n } from "./Table";

const PROGRAM_COLUMNS = ["Program", "State", "Stock", "Activity", "Construction request"];
const ALLOCATION_COLUMNS = ["Component", "Request"];

export function CellOrganization({ inspection }: { inspection: Inspection }) {
  const cell = inspection.cell;
  if (!cell) return null;
  const active = cell.installed.programs.filter(Boolean).length;
  const records = cell.installed.programs
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
        One internal mixture. Retained free and bound chemistry changes processing rates; activity
        does not remove machinery upkeep. Retired stock remains until paid dismantling.
      </p>
      <Table
        columns={PROGRAM_COLUMNS}
        rows={records.map(({ program, slot, stock }) => [
          slot,
          program ? "active" : "retired",
          n(stock),
          program ? n(cell.action.activity[slot]) : "0",
          program ? n(cell.action.allocation[enzymeStock(slot)]) : "0",
        ])}
      />
      <p>
        Retirement effort {n(cell.action.retirement)}. Last tick: material constructed{" "}
        {n(cell.flows.constructed)}, retired {n(cell.flows.retired)}; work spent{" "}
        {n(cell.flows.construction)}.
      </p>
      <p>
        Field-facing interface {n((inspection.fieldInterface ?? 1) * 100)}%. Contact material:
        received {n(cell.flows.contactImported)}, lost {n(cell.flows.contactLost)} this tick. Direct
        uptake requires an injured neighbor; ordinary export enters the public field.
      </p>
      <details>
        <summary>Construction allocation</summary>
        <Table
          columns={ALLOCATION_COLUMNS}
          rows={BODY_PARTS.map((part, i) => [part, n(cell.action.allocation[i])])}
        />
      </details>
    </details>
  );
}
