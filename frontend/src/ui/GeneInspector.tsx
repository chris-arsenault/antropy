import { type Cell, type World } from "../sim/types";
import { controller } from "../sim/controller";
import { express } from "../sim/genetics/genotype";
import { encodeGenotype } from "../sim/genetics/codec";
import { targetBody } from "../sim/phenotype";
import { BODY_PARTS, materialCapacity, energyCapacity, locomotion } from "../sim/body";

export function GeneInspector({ world, cell }: { world: World; cell: Cell }) {
  const genome = world.genomes.get(cell.genome)!.genome,
    target = targetBody(world, cell);
  const rates = locomotion(cell, world.config);
  return (
    <details>
      <summary>Inherited genes and acquired learning</summary>
      <p>
        Chromosomes: {genome.chromosomes.length} · reserve capacity{" "}
        {materialCapacity(cell.body, world.config).toFixed(3)} · usable energy capacity{" "}
        {energyCapacity(cell.body, world.config).toFixed(3)}
      </p>
      <p>
        Maximum speed {rates.speed.toFixed(3)} · maximum turn rate {rates.turnRate.toFixed(3)}
      </p>
      <p>
        Acquired recurrent weight RMS:{" "}
        {controller.learnedMagnitude(express(genome).behavior, cell.brain).toExponential(3)}
      </p>
      <p>
        Acquired change in this genotype: {world.genomes.get(cell.genome)!.learned.toExponential(3)}
      </p>
      <table>
        <thead>
          <tr>
            <th>Material stock</th>
            <th>Built</th>
            <th>Division target</th>
          </tr>
        </thead>
        <tbody>
          {BODY_PARTS.map((key) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{cell.body[key].toFixed(3)}</td>
              <td>{(2 * target[key]).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <pre>
        {JSON.stringify(
          {
            built: cell.body,
            newbornTarget: target,
            inherited: encodeGenotype(genome),
            acquired: controller.encodeState(cell.brain),
          },
          null,
          2
        )}
      </pre>
    </details>
  );
}
