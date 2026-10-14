export interface ControlView {
  context: number[];
  generatedContext: number[];
  contextMean: number[];
  clamped: boolean;
  learningGain: number;
  retention: number[];
  longTime: number;
  interval: number;
  elapsed: number;
  evaluations: number;
  neighbors: number[];
  neighborCoverage: number;
  strategicInputs: number[];
  hearing: number[];
  pendingHearing: number[];
  activityReinforcement: {
    state: number[];
    bias: number[];
    ports: [number, number][];
    enabled: boolean;
    rate: number;
    gain: number;
  };
}

export interface CellAction {
  swim: number;
  turn: number;
  repair: number;
  transport: number[];
  activity: number[];
  cover: number;
  emission: number;
  speech: number;
  speechEffort: number;
}
