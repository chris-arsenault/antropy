import { useState } from "react";
import { type Bridge } from "./bridge";
import { type Definition, type EngineConfig } from "./types";

const policies = {
  learning: ["plastic", "static"],
  ploidy: ["haploid", "diploid"],
  transmission: ["clonal", "selfing"],
  crossover: ["uniform", "one-point"],
  mutationKind: ["gaussian", "uniform"],
  reproduction: ["fission", "budding"],
} as const;
const fields = [
  ["width", "World width", 8],
  ["height", "World height", 8],
  ["founders", "Starting cells", 2],
  ["sourceCount", "Renewing reservoirs", 0],
  ["sourceRate", "Source release rate", 0],
  ["sourceLifetime", "Reservoir batch duration", 0.01],
  ["sourceGap", "Source renewal gap", 0],
  ["sourceRadius", "Source radius", 0.01],
  ["sourceDrift", "Reservoir mobility", 0],
  ["reservoirRepulsion", "Reservoir like-charge repulsion", 0],
  ["reservoirRange", "Reservoir repulsion range", 0.01],
  ["adhesion", "Cell contact adhesion", 0],
  ["attractionLength", "Material attraction reach", 0],
  ["sourceProcessing", "Stored-resource weathering multiplier", 0],
  ["illuminationContrast", "Illumination contrast (0–1)", 0],
  ["shadeStrength", "Permanent shade strength (0–1)", 0],
  ["shadeScale", "Terrain shade scale (world units)", 0.01],
  ["opticalColumn", "Film mass / area for optical depth 1", 0.00001],
  ["opticalReach", "Emission spread (world units)", 0.01],
  ["opticalPowerDensity", "Work / area / time for 1× emitted light", 0.00001],
  ["illuminationFastPeriod", "Illumination sweep (model seconds)", 1],
  ["illuminationSlowPeriod", "Illumination cross cycle (model seconds)", 1],
  ["illuminationModulationPeriod", "Illumination modulation (model seconds)", 1],
  ["viscosity", "Viscosity", 0.00001],
  ["mutationRate", "Controller mutation probability", 0],
  ["physicalMutationRate", "Physical mutation probability", 0],
  ["learningRetention", "Learned change inherited", 0],
] as const;

function composition(config: EngineConfig, layout: string): EngineConfig {
  const count = config.sourceSpecies.length;
  const pure = (index: number) => Array.from({ length: count }, (_, j) => Number(index === j));
  const mixes = [pure(0), pure(1 % count)];
  const epochs = [0.8, 0.2].map((share) =>
    Array.from({ length: count }, (_, i) =>
      i === 0 ? share : (1 - share) / Math.max(1, count - 1)
    )
  );
  return {
    ...config,
    sourceEpochs:
      layout === "epochs"
        ? {
            phaseTicks: config.sourceEpochs?.phaseTicks ?? 50000,
            mixtures: count === 1 ? [[1]] : epochs,
          }
        : null,
    sourceZones: layout === "zones" ? mixes : null,
  };
}
function layout(config: EngineConfig) {
  if (config.sourceZones) return "zones";
  return config.sourceEpochs ? "epochs" : "mixed";
}
export function Settings({
  bridge,
  definition,
  error,
}: {
  bridge: Bridge;
  definition: Definition;
  error: (e: unknown) => void;
}) {
  const [config, setConfig] = useState(definition.config),
    [seed, setSeed] = useState(String(definition.seed));
  const select = (key: keyof typeof policies, value: string) => {
    const next = { ...config, [key]: value };
    if (key === "transmission" && value === "selfing") next.ploidy = "diploid";
    if (key === "ploidy" && value === "haploid") next.transmission = "clonal";
    setConfig(next);
  };
  function restart() {
    const parsed = Number(seed);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      error(new Error("Seed must be a nonnegative integer"));
      return;
    }
    bridge.call("restart", { seed: parsed, config }).catch(error);
  }
  return (
    <details className="panel" open>
      <summary>Environment and new population</summary>
      <fieldset disabled={bridge.getSnapshot().status?.execution?.operator === false}>
        <label>
          Seed <input value={seed} onChange={(e) => setSeed(e.target.value)} />
        </label>
        <SourceComposition config={config} setConfig={setConfig} />
        <details>
          <summary>Ecology and mutation settings</summary>
          {fields.map(([key, label, min]) => (
            <label key={key}>
              {label}{" "}
              <input
                type="number"
                min={min}
                step="any"
                value={config[key]}
                onChange={(e) => setConfig((c) => ({ ...c, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </details>
        <Policies config={config} select={select} />
        <p>
          Reservoirs contain finite deposits and receive external replenishment after a wait. They
          drift while holding material. Local chemistry changes their composition, which persists
          through empty periods and determines the next refill.
        </p>
        <p>
          Changes take effect on restart. Selfing uses two gametes from one diploid parent. Zero
          mutation probabilities freeze inherited mutation; private learning is controlled
          separately.
        </p>
        <button onClick={restart}>Apply and restart</button>
      </fieldset>
    </details>
  );
}

function Policies({
  config,
  select,
}: {
  config: EngineConfig;
  select: (key: keyof typeof policies, value: string) => void;
}) {
  return (
    <fieldset>
      <legend>Inheritance and lifetime learning</legend>
      {(Object.keys(policies) as (keyof typeof policies)[]).map((key) => (
        <label key={key}>
          {key}{" "}
          <select
            value={config[key]}
            disabled={key === "crossover" && config.transmission === "clonal"}
            onChange={(e) => select(key, e.target.value)}
          >
            {policies[key].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
    </fieldset>
  );
}

function SourceComposition({
  config,
  setConfig,
}: {
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
}) {
  return (
    <>
      {" "}
      <label>
        Incoming feedstock composition{" "}
        <select
          value={layout(config)}
          onChange={(e) => setConfig(composition(config, e.target.value))}
        >
          <option value="mixed">Local chemical mixtures</option>
          <option value="epochs">Alternating epochs</option>
          <option value="zones">Separated chemical sources</option>
        </select>
      </label>
      {config.sourceEpochs && (
        <label>
          Ticks per source epoch{" "}
          <input
            type="number"
            min="1"
            step="1"
            value={config.sourceEpochs.phaseTicks}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                sourceEpochs: { ...c.sourceEpochs!, phaseTicks: Number(e.target.value) },
              }))
            }
          />
        </label>
      )}
    </>
  );
}
