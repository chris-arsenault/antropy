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
