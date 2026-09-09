import { EnvironmentControls } from "./EnvironmentControls";
import { type SimConfig } from "../sim/config";
import { SCENARIOS } from "../sim/scenarios";
import { type ScenarioId, type World } from "../sim/types";
import { PersistenceControls } from "./PersistenceControls";
import { ModelImport } from "./ModelImport";
import { type SimulationHandle } from "./useSimulation";
import { SPEEDS, type Speed } from "./pacing";

export interface ControlsProps {
  readonly config: SimConfig;
  readonly onConfig: (config: SimConfig) => void;
  readonly simulation: SimulationHandle;
  readonly scenario: ScenarioId;
  readonly seedInput: string;
  readonly onScenario: (scenario: ScenarioId) => void;
  readonly onSeedInput: (seed: string) => void;
  readonly onNewWorld: () => void;
  readonly onRestore: (world: World) => void;
  readonly modelAvailable: boolean;
}

export function Controls(props: ControlsProps) {
  const { simulation } = props;
  return (
    <div className="controls">
      <button type="button" onClick={simulation.running ? simulation.pause : simulation.start}>
        {simulation.running ? "Pause" : "Run"}
      </button>
      <label>
        Creature
        <select
          data-testid="scenario-select"
          value={props.scenario}
          onChange={(event) => props.onScenario(event.target.value as ScenarioId)}
        >
          {SCENARIOS.filter(
            (scenario) => scenario.id !== "registered-colony" || props.modelAvailable
          ).map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.label}
            </option>
          ))}
        </select>
      </label>
      <EnvironmentControls config={props.config} onApply={props.onConfig} />
      <label>
        Tick rate
        <select
          data-testid="speed-select"
          value={simulation.speed}
          onChange={(event) =>
            simulation.setSpeed(
              event.target.value === "max" ? "max" : (Number(event.target.value) as Speed)
            )
          }
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed === "max" ? "Maximum" : `${speed} ticks/s`}
            </option>
          ))}
        </select>
      </label>
      <label>
        Seed
        <input
          value={props.seedInput}
          onChange={(event) => props.onSeedInput(event.target.value)}
        />
      </label>
      <button type="button" onClick={props.onNewWorld}>
        New world
      </button>
      <PersistenceControls world={simulation.world} onRestore={props.onRestore} />
      <ModelImport
        config={simulation.world.config}
        seed={simulation.world.seed}
        onRestore={props.onRestore}
      />
    </div>
  );
}
