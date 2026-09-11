import { type World } from "../sim/types";
import { branch, relatedness, familyOrigin } from "../observe/ancestry";
import { comparisonTo } from "../observe/geneticDistance";

export function RelationshipPanel({ world, selected }: { world: World; selected: number | null }) {
  const reference = world.ancestry.get(selected ?? -1);
  if (!reference) return null;
  const family = branch(world, reference.id).family,
    origin = familyOrigin(world, family);
  const compare = comparisonTo(world.genomes.get(reference.genome)!.genome);
  const rows = world.cells
    .map((cell) => ({
      cell,
      relation: relatedness(world, reference.id, cell.id),
      distance: compare(world.genomes.get(cell.genome)!.genome),
    }))
    .sort(
      (a, b) =>
        (a.relation?.links ?? Infinity) - (b.relation?.links ?? Infinity) || a.cell.id - b.cell.id
    );
  const kin = rows.filter((r) => r.relation !== null).length;
  return (
    <div className="relationship-panel">
      <h3>Family and relatedness</h3>
      <p>
        Reference cell {reference.id} · family F{family} · founder {reference.lineage}. Family root
        born at tick {origin.born}; generation {origin.generation}.
      </p>
      <p>
        {((100 * kin) / Math.max(1, world.cells.length)).toFixed(1)}% of living cells have a
        recorded common ancestor. Map comparison modes can use this reference after it divides or
        dies.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cell / family</th>
            <th>Ancestry links</th>
            <th>Physical³</th>
            <th>RNN⁴</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 5).map(({ cell, relation, distance }) => (
            <tr key={cell.id}>
              <td>
                {cell.id}
                <small>F{branch(world, cell.id).family}</small>
              </td>
              <td>{relation ? relation.links : "unrecorded"}</td>
              <td>{distance.physical.toExponential(1)}</td>
              <td>{distance.controller.toExponential(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Nearest recorded relatives. ³ Expressed physical genes, log RMS distance. ⁴ Inherited
        controller distance, including learning genes. These are separate genetic distances, not
        behavior scores.
      </p>
    </div>
  );
}
