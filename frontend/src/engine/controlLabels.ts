const HISTORY = [
  "Net work balance",
  "Energy fill",
  "Injury",
  "Growth",
  "Receptor level",
  "Net uptake",
  "Crowding",
  "Motor load",
  "Paid light level",
  "Heard activity",
  "Byte diversity",
];
export const STRATEGIC_INPUTS = [
  ...HISTORY.flatMap((name) =>
    ["level", "surprise", "volatility"].map((kind) => name + " " + kind)
  ),
  "Age",
  "Divisions",
  "Time since division",
  "Path straightness",
  "Private byte",
  "Motor fraction",
  "Transporter fraction",
  "Enzyme fraction",
  "Swim effort",
  "Turn magnitude",
  "Repair effort",
  "Fast light cosine",
  "Fast light sine",
  "Slow light cosine",
  "Slow light sine",
  "Light modulation cosine",
  "Light modulation sine",
  "Local supply cosine",
  "Local supply sine",
  "Reservoir stocked fraction",
  "Reservoir elapsed empty time",
  "Reservoir coverage",
  ...Array.from({ length: 4 }, (_, i) => "Contact context " + i),
  "Contact coverage",
  "Private noise",
];
export const CONTEXT_COLUMNS = [
  "Context",
  "Reflex input",
  "Generated",
  "Long mean",
  "Contact mean",
];
export const HEARING_COLUMNS = ["Component", "Mean", "Forward moment", "Left moment"];
export const INPUT_COLUMNS = ["Input", "Value"];
