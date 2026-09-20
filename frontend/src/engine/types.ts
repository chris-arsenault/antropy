export interface SourceSchedule {
  phaseTicks: number;
  mixtures: number[][];
}
export interface EngineConfig extends Record<string, unknown> {
  width: number;
  height: number;
  mesh: number;
  dt: number;
  physiologyInterval: number;
  weatheringRate: number;
  illuminationContrast: number;
  illuminationFastPeriod: number;
  illuminationSlowPeriod: number;
  illuminationModulationPeriod: number;
  habitatFeedback: boolean;
  founders: number;
  chemistrySeed: number;
  sourceCount: number;
  sourceRate: number;
  sourceLifetime: number;
  sourceGap: number;
  sourceDrift: number;
  attractionLength: number;
  sourceProcessing: number;
  sourceRadius: number;
  viscosity: number;
  sourceSpecies: number[];
  sourceEpochs: SourceSchedule | null;
  sourceZones: number[][] | null;
  mutationRate: number;
  physicalMutationRate: number;
  learningRetention: number;
  learning: "plastic" | "static";
  ploidy: "haploid" | "diploid";
  transmission: "clonal" | "selfing";
  crossover: "uniform" | "one-point";
  reproduction: "fission" | "budding";
  mutationKind: "gaussian" | "uniform";
}
export interface ChemicalProperty {
  potential: number;
  diffusion: number;
  impedance: number;
  stress: number;
  interaction: [number, number];
}
export interface Definition {
  seed: number;
  version: number;
  config: EngineConfig;
  chemistry: {
    version: number;
    seed: number;
    properties: ChemicalProperty[];
    decomposition: number;
    coefficients: number[][];
    profiles: { coefficients: [number[], number[]] };
  };
  sources: { x: number; y: number; radius: number; richness: number; share: number }[];
  patchCenters: [number, number][];
}
export interface Flows {
  imported: number;
  exported: number;
  reacted: number;
  captured: number;
  externalWork: number;
  constructed: number;
  retired: number;
  contactImported: number;
  contactLost: number;
  maintenance: number;
  motors: number;
  learning: number;
  transport: number;
  reactionHeat: number;
  construction: number;
  refitting: number;
  repair: number;
  repaired: number;
  exposure: number;
  damage: number;
  distance: number;
}
export interface Summary {
  tick: number;
  modelSeconds: number;
  population: number;
  lineages: number;
  genomes: number;
  generation: number;
  cellEnergy: number;
  biomass: number;
  heldMaterial: number;
  heldEnergy: number;
  materialResidual: number;
  energyResidual: number;
  ancestryRecords: number;
  stopReason: string | null;
  ledger: {
    initialMaterial: number;
    initialEnergy: number;
    supplied: number;
    suppliedEnergy: number;
    washedOut: number;
    washoutEnergy: number;
    numericalMaterial: number;
    numericalEnergy: number;
    divisions: number;
    births: number;
    deaths: number;
    damageDeaths: number;
    divisionHeat: number;
    deathHeat: number;
    overflowHeat: number;
    weatheringHeat: number;
    weatheringWork: number;
    weatheredMaterial: number;
    shelteredConversion: number;
    sourceHeat: number;
    sourceWork: number;
    sourceConverted: number;
    sourceReleased: number;
    sourceDistance: number;
    mutations: number;
    learnedBirths: number;
    recombinations: number;
    transfers: number;
    blockedDivisions: number;
    organismTime: number;
    flows: Flows;
  };
}
export interface Ancestor {
  id: number;
  parent: number | null;
  lineage: number;
  genome: number;
  born: number;
  ended: number | null;
  cause: string;
}
export interface Target {
  x: number;
  y: number;
}
export interface Machinery {
  receptors: Target[];
  inward: number[];
  programs: boolean[];
  transporters: Target[];
  enzymes: (Target & { centerX: number; centerY: number; angle: number })[];
  membrane: Target;
}
export interface Genotype {
  id: number;
  parent: number | null;
  born: number;
  learned: number;
  mutated: boolean;
  chromosomes: {
    behavior: { weights: number[]; plasticity: number[] };
    physical: number[];
    chemistry: Machinery;
  }[];
}
export interface CellState {
  machineryGenome: number;
  machineryRevision: number;
  installed: Machinery;
  id: number;
  parent: number | null;
  lineage: number;
  genome: number;
  generation: number;
  born: number;
  x: number;
  y: number;
  heading: number;
  body: number[];
  inventory: { amounts: number[]; material: number };
  boundMaterial: { amounts: number[]; material: number };
  energy: number;
  damage: number;
  inputs: number[];
  receptors: number[];
  photoreceptor: number;
  contacts: number[];
  brain: { hidden: number[]; traces: number[]; task: number; lastEnergy: number | null };
  action: {
    swim: number;
    turn: number;
    repair: number;
    transport: number[];
    activity: number[];
    allocation: number[];
    retirement: number;
  };
  flows: Flows;
  chemicalFlows: { imported: number[]; exported: number[]; consumed: number[]; produced: number[] };
}
export interface Inspection {
  fieldInterface: number | null;
  installedChemistry: Machinery | null;
  genealogy: {
    generation: number;
    family: number;
    parentFamily: number | null;
    familyBorn: number;
    familyGeneration: number;
    path: Ancestor[];
    hiddenAncestors: number;
    children: Ancestor[];
    childCount: number;
    siblings: Ancestor[];
    siblingCount: number;
    descendants: Ancestor[];
    descendantCount: number;
  };
  tick: number;
  cell: CellState | null;
  ancestor: Ancestor;
  genotype: Genotype | null;
  blueprint: number[] | null;
  exposure: number | null;
  impedance: number | null;
  mobility: number | null;
  weathering: [number, number, number] | null;
  illumination: [number, number] | null;
  expressed: Genotype["chromosomes"][number] | null;
  local: number[] | null;
  relationships: {
    kin: number;
    population: number;
    rows: {
      cell: number;
      family: number;
      links: number | null;
      physical: number | null;
      controller: number | null;
    }[];
  };
  events: { tick: number; kind: string; cell: number; values: number[] }[];
}
export interface Distribution {
  ceiling: number;
  bins: number[];
  p10: number | null;
  median: number | null;
  p90: number | null;
}
export interface PopulationSample {
  evolution: EvolutionSample;
  tick: number;
  familyProfiles: {
    id: number;
    parent: number | null;
    born: number;
    generation: number;
    count: number;
    motor: number;
    membrane: [number, number];
  }[];
  traits: Distribution[];
  efforts: Distribution[];
  membrane: number[];
  families: { total: number; rows: [number, number][] };
  lineages: { total: number; rows: [number, number][] };
}
export interface EvolutionSample {
  distinctSequences: number;
  targetPercentFounder: (number | null)[];
  body: Distribution[];
  controllerDistance: Distribution;
  acquiredChange: Distribution;
  tasks: number[];
  epoch: { phase: number; phaseTicks: number; nextTick: number; mixture: number[] } | null;
}
export interface BehaviorSample {
  tick: number;
  population: number;
  bins: number[][];
}
export interface Region {
  id: number;
  x: number;
  y: number;
  born: number;
  established: number | null;
  membraneX: number;
  members: number[];
  origins: number[];
  lineages: [number, number][];
}
export interface SpatialEvent {
  tick: number;
  population: number;
  kind: "appearance" | "split" | "merge" | "migration" | "founding" | "dissolved";
  x: number;
  y: number;
  cells: number;
  others: number[];
}
export interface SpatialState {
  tick: number;
  nextId: number;
  regions: Region[];
  origins: [number, number][];
  events: SpatialEvent[];
  dropped: number;
}
export interface RegionSummary extends Omit<Region, "members"> {
  count: number;
}
export interface HistoryPoint {
  phenotype?: import("./phenotypes").PhenotypePoint;
  membrane: number[];
  tick: number;
  population: number;
  biomass: number;
  divisions: number;
  deaths: number;
  traits: number[];
  families: [number, number][];
  lineages: [number, number][];
  regions: Pick<RegionSummary, "id" | "x" | "y" | "count" | "membraneX">[];
  regionCount: number;
}
export interface ObservationState {
  pin?: import("./phenotypes").SavedPin | null;
  recent: BehaviorSample[];
  history: HistoryPoint[];
  runId: string;
  spatial: SpatialState;
  executions: { digest: string; tick: number }[];
}
export interface ChemicalOverview {
  tick: number;
  total: number;
  present: number;
  other: number;
  rows: { id: number; amount: number; peak: number }[];
}
export interface LiveStatus {
  phenotype: import("./phenotypes").PhenotypeReport | null;
  chemicalWeb: import("./chemicalWeb").ChemicalWeb | null;
  chemicals: ChemicalOverview;
  workerWork: {
    simulationMs: number;
    renderMs: number;
    observationMs: number;
    frames: number;
    skippedFrames: number;
  } | null;
  recent: BehaviorSample[];
  kernelDigest: string;
  summary: Summary;
  running: boolean;
  speed: number | "max";
  throughput: number;
  recovery: string;
  error: string | null;
  history: HistoryPoint[];
  memoryBytes: number;
  population: PopulationSample;
  regions: RegionSummary[];
  spatialEvents: SpatialEvent[];
  eventsDropped: number;
}
