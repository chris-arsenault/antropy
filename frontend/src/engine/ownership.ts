/** ADR 0020: these are reduced observations or explicit controls, never render frames. */
const BROWSER_COMMANDS = new Set([
  "create",
  "definition",
  "summary",
  "chemicalOverview",
  "chemicalWeb",
  "phenotype",
  "stepStatus",
  "census",
  "inspectSelected",
  "pick",
  "task",
  "dispose",
]);

export function checkBrowserCommand(op: string, payload: Record<string, unknown>) {
  if (!BROWSER_COMMANDS.has(op) || (op === "create" && "diagnostic" in payload))
    throw new Error(`Data ownership contract forbids browser command: ${op}`);
}

/** Limits apply before decoding; persistence and headless artifact export are separate paths. */
export function browserReplyLimit(op: string) {
  if (op === "census") return 16 * 1024 * 1024;
  if (op === "definition") return 2 * 1024 * 1024;
  if (op === "inspectSelected") return 256 * 1024;
  return 16 * 1024;
}
