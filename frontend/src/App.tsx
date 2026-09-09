import { type SimConfig } from "./sim/config";
import { withReviewPressures } from "./sim/reviewConfig";
import { ObservationDock } from "./ui/ObservationDock";
import { storedFood } from "./sim/resources";
import { useCallback, useState } from "react";
import {
  buildScenarioWorld,
  DEFAULT_SCENARIO,
  scenarioDefinition,
  scenarioConfig,
} from "./sim/scenarios";
import { type ScenarioId, type World } from "./sim/types";
import { type RegisteredModel, validateRegisteredModel } from "./sim/controller/registeredModel";
import reviewColonyJson from "./sim/controller/review-colony.json?raw";
import { createRegisteredWorld } from "./sim/world";
import { Controls } from "./ui/Controls";
import { useSimulation } from "./ui/useSimulation";
import { WorldView, type LayerVisibility } from "./ui/WorldView";

const DEFAULT_SEED = 1;
const REVIEW_MODEL = validateRegisteredModel(JSON.parse(reviewColonyJson) as RegisteredModel);

type ScenarioWorldBuilder = (scenario: ScenarioId, seed: number, config: SimConfig) => World;

function freshWorldFactory(
  seed: number,
  scenario: ScenarioId,
  buildWorld: ScenarioWorldBuilder,
  model: RegisteredModel | null = null,
  config: SimConfig = scenarioConfig(scenario, "reference")
): () => World {
  return () =>
    scenario === "registered-colony" && model
      ? createRegisteredWorld(seed, model, config)
      : buildWorld(scenario, seed, config);
}

interface Run {
  id: number;
  factory: () => World;
}

interface ConfiguredAppProps {
  readonly initialController: ScenarioId | null;
  readonly buildWorld: ScenarioWorldBuilder;
  readonly initialModel: RegisteredModel | null;
  readonly initialSeed: number;
}

export function App() {
  return (
    <ConfiguredApp
      buildWorld={buildScenarioWorld}
      initialModel={REVIEW_MODEL}
      initialSeed={101}
      initialController="colony-programmed"
    />
  );
}

function initialSettings(controller: ScenarioId | null, model: RegisteredModel | null) {
  const initialScenario = controller ?? (model ? "registered-colony" : DEFAULT_SCENARIO);
  const historicalLayout = model ? "tiered" : "reference";
  const initialConfig = scenarioConfig(initialScenario, controller ? "compact" : historicalLayout);
  return {
    initialScenario,
    initialConfig: controller ? withReviewPressures(initialConfig) : initialConfig,
  };
}

export function ConfiguredApp(props: ConfiguredAppProps) {
  const { buildWorld, initialModel, initialSeed, initialController } = props;
  const { initialScenario, initialConfig } = initialSettings(initialController, initialModel);
  const [config, setConfig] = useState<SimConfig>(initialConfig);
  const [seedInput, setSeedInput] = useState(String(initialSeed));
  const [scenario, setScenario] = useState<ScenarioId>(initialScenario);
  const [model, setModel] = useState<RegisteredModel | null>(initialModel);
  const [run, setRun] = useState<Run>({
    id: 0,
    factory: freshWorldFactory(initialSeed, initialScenario, buildWorld, initialModel, config),
  });

  const restart = useCallback((factory: () => World): void => {
    setRun((previous) => ({ id: previous.id + 1, factory }));
  }, []);

  const parsedSeed = useCallback((): number => {
    const seed = Number.parseInt(seedInput, 10);
    return Number.isFinite(seed) ? seed : DEFAULT_SEED;
  }, [seedInput]);

  const newWorld = useCallback((): void => {
    restart(freshWorldFactory(parsedSeed(), scenario, buildWorld, model, config));
  }, [buildWorld, parsedSeed, restart, scenario, model, config]);

  const changeScenario = useCallback(
    (next: ScenarioId): void => {
      setScenario(next);
      const base = scenarioConfig(next, "reference");
      const nextConfig = {
        ...base,
        environment: config.environment,
        chemistry: config.chemistry,
        climate: config.climate,
        width: config.width,
        height: config.height,
        surfaceBase: config.surfaceBase,
        nestSeed: config.nestSeed,
      };
      setConfig(nextConfig);
      restart(freshWorldFactory(parsedSeed(), next, buildWorld, model, nextConfig));
    },
    [buildWorld, parsedSeed, restart, model, config]
  );

  const restore = useCallback(
    (world: World): void => {
      setConfig(world.config);
      setScenario(world.scenario);
      setModel(world.registeredController);
      setSeedInput(String(world.seed));
      restart(() => world);
    },
    [restart]
  );

  const changeConfig = useCallback(
    (next: SimConfig) => {
      setConfig(next);
      restart(freshWorldFactory(parsedSeed(), scenario, buildWorld, model, next));
    },
    [parsedSeed, scenario, buildWorld, model, restart]
  );

  return (
    <SimRun
      key={run.id}
      factory={run.factory}
      config={config}
      onConfig={changeConfig}
      scenario={scenario}
      onScenario={changeScenario}
      seedInput={seedInput}
      onSeedInput={setSeedInput}
      onNewWorld={newWorld}
      onRestore={restore}
      modelAvailable={model !== null}
    />
  );
}

interface SimRunProps {
  config: SimConfig;
  onConfig(config: SimConfig): void;
  modelAvailable: boolean;
  factory: () => World;
  scenario: ScenarioId;
  onScenario(value: ScenarioId): void;
  seedInput: string;
  onSeedInput(value: string): void;
  onNewWorld(): void;
  onRestore(world: World): void;
}

function SimRun({
  config,
  onConfig,
  factory,
  scenario,
  onScenario,
  seedInput,
  onSeedInput,
  onNewWorld,
  onRestore,
  modelAvailable,
}: SimRunProps) {
  const simulation = useSimulation(factory);
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
  const scenarioInfo = scenarioDefinition(scenario);
  const changeLayer = useCallback((key: keyof LayerVisibility, visible: boolean): void => {
    setLayers((current) => ({ ...current, [key]: visible }));
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Antropy</h1>
        <p className="status-line">
          Tick <span data-testid="tick">{simulation.version}</span> · seed {simulation.world.seed} ·
          workers {simulation.world.ants.length} · stored food{" "}
          {storedFood(simulation.world).toFixed(1)} · queen{" "}
          {simulation.world.queen.alive ? simulation.world.queen.energy.toFixed(1) : "dead"}
        </p>
        <p className="status-line" data-testid="world-mode">
          {scenarioInfo.label} · {scenarioInfo.description}
        </p>
        <Controls
          simulation={simulation}
          config={config}
          onConfig={onConfig}
          scenario={scenario}
          onScenario={onScenario}
          seedInput={seedInput}
          onSeedInput={onSeedInput}
          onNewWorld={onNewWorld}
          onRestore={onRestore}
          modelAvailable={modelAvailable}
        />
      </header>
      <div className="app-body">
        <WorldView world={simulation.world} version={simulation.version} layers={layers} />
        <ObservationDock simulation={simulation} layers={layers} onLayer={changeLayer} />
      </div>
    </main>
  );
}

const DEFAULT_LAYERS: LayerVisibility = {
  temperature: true,
  moisture: false,
  routes: false,
  foodOdor: false,
  nestOdor: false,
  pheromoneA: false,
  pheromoneB: false,
  freshAir: false,
};
