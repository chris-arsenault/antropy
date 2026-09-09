export type SimulationPhase = "resources" | "settling" | "fields" | "actors" | "lifecycle";

export type PhaseContexts = Record<SimulationPhase, unknown>;

export interface MechanismIdentity {
  readonly id: string;
  readonly version: number;
  readonly phase: SimulationPhase;
}

export type SimulationSystem<Contexts extends PhaseContexts> = {
  [Phase in SimulationPhase]: MechanismIdentity & {
    readonly phase: Phase;
    run(context: Contexts[Phase]): void;
  };
}[SimulationPhase];

const PHASE_ORDER: readonly SimulationPhase[] = [
  "resources",
  "settling",
  "fields",
  "actors",
  "lifecycle",
];

function validateIdentity(system: MechanismIdentity, ids: ReadonlySet<string>): void {
  if (
    typeof system.id !== "string" ||
    !system.id ||
    ids.has(system.id) ||
    !Number.isSafeInteger(system.version) ||
    system.version < 1
  )
    throw new Error("invalid or duplicate simulation mechanism");
}

function execute<Contexts extends PhaseContexts>(
  system: SimulationSystem<Contexts>,
  capabilities: Contexts
): void {
  switch (system.phase) {
    case "resources":
      system.run(capabilities.resources);
      break;
    case "fields":
      system.run(capabilities.fields);
      break;
    case "settling":
      system.run(capabilities.settling);
      break;
    case "actors":
      system.run(capabilities.actors);
      break;
    case "lifecycle":
      system.run(capabilities.lifecycle);
      break;
  }
}

/** Registration order is deterministic; invalid order is rejected rather than silently sorted. */
export function createKernel<Contexts extends PhaseContexts>(
  systems: readonly SimulationSystem<Contexts>[]
) {
  const ids = new Set<string>();
  let previous = -1;
  for (const system of systems) {
    const order = PHASE_ORDER.indexOf(system.phase);
    validateIdentity(system, ids);
    if (order < 0 || typeof system.run !== "function")
      throw new Error("invalid simulation phase or implementation");
    if (order < previous) throw new Error("simulation mechanisms are out of phase order");
    ids.add(system.id);
    previous = order;
  }
  const registered = systems.map((system) => Object.freeze({ ...system }));
  return Object.freeze({
    manifest: Object.freeze(
      registered.map(({ id, version, phase }) => Object.freeze({ id, version, phase }))
    ),
    step(capabilities: Contexts): void {
      for (const system of registered) execute(system, capabilities);
    },
  });
}
