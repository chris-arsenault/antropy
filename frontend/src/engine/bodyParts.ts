export const enzymeStock = (slot: number) => (slot < 4 ? 11 + slot : 12 + slot);
export function machineryLabel(index: number) {
  if (index < 4) return `Receptor ${index}`;
  return index < 8 ? `Transporter ${index - 4}` : `Enzyme ${index - 8}`;
}
export const BODY_PARTS = [
  "Core",
  "Motor",
  "Storage",
  ...Array.from({ length: 12 }, (_, i) => machineryLabel(i)),
  "Photoreceptor",
  ...Array.from({ length: 4 }, (_, i) => `Enzyme ${i + 4}`),
];
