/**
 * Chart color roles (dataviz skill reference palette, dark mode — validated
 * with validate_palette.js against the panel surface: 4 slots, all checks
 * pass). The app is dark-only; text wears ink tokens, never series color.
 */
export const CHART = {
  surface: "#1a1a19",
  inkPrimary: "#ffffff",
  inkSecondary: "#c3c2b7",
  inkMuted: "#898781",
  gridline: "#2c2c2a",
  baseline: "#383835",
  series: ["#3987e5", "#d95926", "#199e70", "#c98500"] as const,
  divergingPositive: "#3987e5",
  divergingNegative: "#e66767",
} as const;

/** CSS class for a legend chip of a given series color (see styles.css). */
export function chipClass(color: string): string {
  const index = (CHART.series as readonly string[]).indexOf(color);
  return index >= 0 ? `chip-s${index + 1}` : "chip-s1";
}
