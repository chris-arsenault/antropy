export interface TerrainConfig {
  elevation: boolean;
  movement: boolean;
  transport: boolean;
  processing: boolean;
  transmission: boolean;
  ceiling: boolean;
  seasons: boolean;
  feedback: boolean;
  slopeResistance: number;
  minimumConductance: number;
  ceilingMin: number;
  ceilingMax: number;
  seasonAmplitude: number;
  seasonPeriod: number;
  placement: "current" | "fractal" | "uniform";
  featureWavelength: number;
}

export interface LocalTerrain {
  height: number;
  conductance: number;
  slope: number;
  supplyMultiplier: number;
  seasonAmplitude: number;
}

export function terrainPreset(current: TerrainConfig, integrated: boolean): TerrainConfig {
  return {
    ...current,
    elevation: integrated,
    movement: integrated,
    transport: integrated,
    processing: integrated,
    transmission: true,
    ceiling: false,
    seasons: integrated,
    feedback: integrated,
    placement: integrated ? "fractal" : "current",
  };
}
