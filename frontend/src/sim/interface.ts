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
  "Food B tonic",
  "Food B phasic",
  "Food B forward",
  "Food B left",
  "Toxin tonic",
  "Toxin phasic",
  "Toxin forward",
  "Toxin left",
  "Matrix density",
  "Matrix forward",
  "Matrix left",
  "Damage",
  "Built B processing",
  "Built defense",
  "Built toxin machinery",
  "Built matrix machinery",
] as const;
export const INPUTS = SENSOR_NAMES.length;
export interface Action {
  swim: number;
  turn: number;
  secrete: number;
  toxin: number;
  matrix: number;
  repair: number;
}
export const emptyAction = (): Action => ({
  swim: 0,
  turn: 0,
  secrete: 0,
  toxin: 0,
  matrix: 0,
  repair: 0,
});
