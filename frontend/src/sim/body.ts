import { type Config } from "./config";

export const BODY_PARTS = ["core", "motor", "transport", "storage"] as const;
export type Body = Record<(typeof BODY_PARTS)[number], number>;
export interface Embodied {
  body: Body;
  reserve: number;
  energy: number;
}
export const structuralMass = (body: Body): number =>
  BODY_PARTS.reduce((s, key) => s + body[key], 0);
export const scaleBody = (body: Body, scale: number): Body => ({
  core: body.core * scale,
  motor: body.motor * scale,
  transport: body.transport * scale,
  storage: body.storage * scale,
});
export const materialCapacity = (body: Body, c: Config): number => body.storage * c.storageCapacity;
export const energyCapacity = (body: Body, c: Config): number => body.core * c.energyCapacity;
export const bodyVolume = (cell: Pick<Embodied, "body" | "reserve">, c: Config): number =>
  structuralMass(cell.body) / c.bodyDensity + cell.reserve / c.reserveDensity;
export const bodyRadius = (cell: Pick<Embodied, "body" | "reserve">, c: Config): number =>
  Math.cbrt((3 * bodyVolume(cell, c)) / (4 * Math.PI));
export function basal(cell: Embodied, c: Config): number {
  const b = cell.body;
  return (
    c.dt *
    (b.core * c.maintenance +
      b.motor * c.motorMaintenance +
      b.transport * c.transporterMaintenance +
      b.storage * c.storageMaintenance +
      c.controllerCost)
  );
}
export function locomotion(cell: Embodied, c: Config) {
  const r = bodyRadius(cell, c),
    power = cell.body.motor * c.motorPowerDensity;
  const translation = 6 * Math.PI * c.viscosity * r;
  const rotation = 8 * Math.PI * c.viscosity * r ** 3;
  return {
    power,
    speed: Math.sqrt((c.motorEfficiency * power) / translation),
    turnRate: Math.sqrt((c.motorEfficiency * power) / rotation),
    rotationalDiffusion: c.thermalEnergy / rotation,
  };
}
