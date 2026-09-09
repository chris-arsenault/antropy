import { type World } from "../sim/types";
import { inspectController } from "../sim/controller/runtime";

export function EffectiveConfigPanel({ world }: { readonly world: World }) {
  const controller = inspectController(
    world.scenario,
    world.registeredController,
    world.config.mortalityEnabled
  );
  const entries: readonly [string, string | number][] = [
    ["world", `${world.config.width} × ${world.config.height}`],
    ...Object.entries(world.config.environment).map(([key, value]): [string, string] => [
      key,
      String(value),
    ]),
    ["initial ground datum", world.config.surfaceBase],
    ["food objects", world.config.foodCount],
    ["entrance food clearance", world.config.foodClearance],
    ["cache capacity", world.config.cacheCapacity],
    ["founder workers", world.config.workerCount],
    ["worker metabolism / tick", world.config.metabolism],
    ["queen metabolism / tick", world.config.queenMetabolism],
    ["source regrowth / tick", world.config.foodRegrowth],
    ["source capacity", world.config.sourceCapacity],
    ["energy / food unit", world.config.foodEnergyDensity],
    ["crop capacity", world.config.cropCapacity],
    [
      "egg / larva / pupa ticks",
      `${world.config.eggDuration} / ${world.config.larvaDuration} / ${world.config.pupaDuration}`,
    ],
    ["controller", world.scenario],
    ["controller inputs", controller.inputs],
    ["RNN hidden units", controller.hidden],
    ["RNN parameters", controller.parameters],
    ["odor cadence", `${world.config.chemistryInterval} ticks`],
    ["food diffusion", world.config.chemistry.odor.diffusion],
    ["food evaporation", world.config.chemistry.odor.evaporation],
    ["colony diffusion", world.config.chemistry.nestOdor.diffusion],
    ["colony evaporation", world.config.chemistry.nestOdor.evaporation],
    ["pheromone diffusion", world.config.chemistry.pheromone.diffusion],
    ["pheromone evaporation", world.config.chemistry.pheromone.evaporation],
    ["initial energy", world.config.initialEnergy],
    ["worker lifespan", world.config.workerLifespan],
    ["worker egg cost", world.config.workerEggCost],
    ["sensor cost", world.config.sensorCost],
    ["move cost", world.config.moveCost],
    ["turn cost", world.config.turnCost],
    ["mandible cost", world.config.mandibleCost],
    ["pheromone cost", world.config.pheromoneCost],
    ["digging", world.config.environment.excavation ? "on" : "off"],
    ["climate cell size", world.config.climate.cellSize],
    ["climate cadence", world.config.climate.interval],
    ["day length", world.config.climate.dayLength],
    ["mean temperature", world.config.climate.meanTemperature],
    ["temperature amplitude", world.config.climate.temperatureAmplitude],
    ["spoiled food energy", world.climate.spoiledEnergy.toFixed(4)],
    ["mortality", world.config.mortalityEnabled ? "on" : "off"],
    ["reproduction", world.config.reproductionEnabled ? "on" : "off"],
    ["genetic evolution", "off"],
  ];
  return (
    <section className="panel" data-testid="effective-config">
      <h2>Effective world configuration</h2>
      <dl className="metrics">
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
