export interface RecoverySummary {
  enabled: boolean;
  severity: number;
  response: number;
  deathRate: number;
  growthRate: number;
  recentBiomass: number;
  deadBody: number;
  recovered: number;
  spill: number;
  storedMaterial: number;
  recentRecovery: number;
  releasedMaterial: number;
}
export interface ReservoirInspection {
  source: number;
  tick: number;
  position: [number, number];
  storedMaterial: number;
  recentRecovery: number;
  recentOutputRate: number;
  releasedMaterial: number;
  emptyElapsed: number;
  nominalRate: number;
  season: number;
}
