export interface BindingKey {
  weights: [number, number, number, number, number, number, number, number];
  bias: number;
}
export interface BindingKeys {
  receptors: BindingKey[];
  transporters: BindingKey[];
  enzymes: BindingKey[];
  membrane: BindingKey;
}
export interface Target {
  x: number;
  y: number;
}
export interface Machinery {
  keys: BindingKeys | null;
  receptors: Target[];
  inward: number[];
  programs: boolean[];
  transporters: Target[];
  enzymes: (Target & { centerX: number; centerY: number; angle: number })[];
  membrane: Target;
}

export interface RecognitionSite {
  site: number;
  key: BindingKey | null;
  active: boolean;
  affinities: [number, number][];
  peak: number;
  preferred: [number, number];
  effectiveBreadth: number;
}
export interface RecognitionProfile {
  kind: "complementarity" | "radial";
  lambda: number;
  sites: RecognitionSite[];
  susceptibility: number[];
}
