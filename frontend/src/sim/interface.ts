/** The physical sensor/action contract is independent of the brain implementation. */
export const SENSOR_NAMES = [
  "Nutrient tonic",
  "Nutrient phasic",
  "Nutrient forward",
  "Nutrient left",
  "Chemical tonic",
  "Chemical phasic",
  "Chemical forward",
  "Chemical left",
  "Usable energy",
  "Growth",
  "Front contact",
  "Left contact",
  "Rear contact",
  "Right contact",
  "Task byte",
  "Built motor capacity",
  "Built transporter capacity",
  "Built storage capacity",
  "Stored nutrient",
] as const;
export const INPUTS = SENSOR_NAMES.length;
export interface Action {
  swim: number;
  turn: number;
  secrete: number;
}
export const emptyAction = (): Action => ({ swim: 0, turn: 0, secrete: 0 });
