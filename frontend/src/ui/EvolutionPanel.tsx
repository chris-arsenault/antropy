import { HIDDEN_COUNT, RNN_GENOME_LENGTH } from "../sim/controller/rnn";
import { type World } from "../sim/types";
import { registeredParameterCount } from "../sim/controller/registeredModel";

function controllerDetails(world: World) {
  if (world.registeredController)
    return {
      hidden: world.registeredController.hidden,
      parameters: registeredParameterCount(world.registeredController),
      tasks: world.registeredController.tasks,
    };
  if (world.scenario === "rnn")
    return { hidden: HIDDEN_COUNT, parameters: RNN_GENOME_LENGTH, tasks: 0 };
  return { hidden: 0, parameters: 0, tasks: 256 };
}

export function EvolutionPanel({ world }: { readonly world: World }) {
  const details = controllerDetails(world);
  return (
    <section className="panel" data-testid="evolution-panel">
      <h2>Controller and evolution</h2>
      <dl className="metrics">
        {world.linearGenome && (
          <div>
            <dt>Linear instructions</dt>
            <dd>{world.linearGenome.instructions.length}</dd>
          </div>
        )}
        <div>
          <dt>active arm</dt>
          <dd>{world.scenario}</dd>
        </div>
        <div>
          <dt>RNN hidden units</dt>
          <dd>{details.hidden}</dd>
        </div>
        <div>
          <dt>RNN parameters</dt>
          <dd>{details.parameters}</dd>
        </div>
        <div>
          <dt>task values</dt>
          <dd>{details.tasks}</dd>
        </div>
        <div>
          <dt>in-world selection</dt>
          <dd>off at this rung</dd>
        </div>
      </dl>
    </section>
  );
}
