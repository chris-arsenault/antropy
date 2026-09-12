import { type Config } from "./config";

export const BODY_PARTS = [
  "core",
  "motor",
  "transport",
  "storage",
  "transportB",
  "defense",
  "weapon",
  "builder",
  "photo",
] as const;
export const BODY_NAMES: Record<(typeof BODY_PARTS)[number], string> = {
  core: "Core",
  motor: "Motors",
  transport: "Food A processing",
  storage: "Storage",
  transportB: "Food B processing",
  defense: "Defense",
  weapon: "Toxin machinery",
  builder: "Matrix machinery",
  photo: "Light harvesting",
};
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
  transportB: body.transportB * scale,
  defense: body.defense * scale,
  weapon: body.weapon * scale,
  builder: body.builder * scale,
  photo: body.photo * scale,
});
export const materialCapacity = (body: Body, c: Config): number => body.storage * c.storageCapacity;
const ACQUISITION = ["transport", "transportB", "photo"] as const;
/** Stock a pathway can actually deploy once membrane crowding by the other pathways is paid. */
export function effectiveStock(body: Body, key: (typeof ACQUISITION)[number], c: Config): number {
  if (c.machineryCrowding === 0) return body[key];
  const all = ACQUISITION.reduce((s, k) => s + body[k], 0);
  return all > 0 ? body[key] * (body[key] / all) ** c.machineryCrowding : 0;
}
export const energyCapacity = (body: Body, c: Config): number => body.core * c.energyCapacity;
export const bodyVolume = (cell: Pick<Embodied, "body" | "reserve">, c: Config): number =>
  structuralMass(cell.body) / c.bodyDensity + cell.reserve / c.reserveDensity;
export const bodyRadius = (cell: Pick<Embodied, "body" | "reserve">, c: Config): number =>
  Math.cbrt((3 * bodyVolume(cell, c)) / (4 * Math.PI));
export function basal(cell: Embodied & { damage: number }, c: Config): number {
  const b = cell.body;
  return (
    c.dt *
    (1 + cell.damage) *
    (b.core * c.maintenance +
      b.motor * c.motorMaintenance +
      b.transport * c.transporterMaintenance +
      b.storage * c.storageMaintenance +
      (b.transportB + b.defense + b.weapon + b.builder) * c.machineryMaintenance +
      b.photo * (c.cycle?.photoMaintenance ?? c.machineryMaintenance) +
      c.controllerCost)
  );
}
export function locomotion(cell: Embodied & { damage: number }, c: Config) {
  const r = bodyRadius(cell, c),
    power = cell.body.motor * c.motorPowerDensity;
  const translation = 6 * Math.PI * c.viscosity * r;
  const rotation = 8 * Math.PI * c.viscosity * r ** 3;
  return {
    power,
    speed: (1 - cell.damage) * Math.sqrt((c.motorEfficiency * power) / translation),
    turnRate: (1 - cell.damage) * Math.sqrt((c.motorEfficiency * power) / rotation),
    rotationalDiffusion: c.thermalEnergy / rotation,
  };
}
