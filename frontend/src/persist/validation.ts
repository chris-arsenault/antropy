import { type Checkpoint } from "./checkpoint";
import { DEFAULT_CONFIG, OPTIONAL_CONFIG, validateConfig, type Config } from "../sim/config";
import { BODY_PARTS, type Body, energyCapacity, materialCapacity } from "../sim/body";
import { createLedger } from "../sim/accounting";
import { controller } from "../sim/controller";
import { decodeGenotype } from "../sim/genetics/codec";
import { INPUTS } from "../sim/interface";
import { validateRelations } from "./relations";
import { PERSISTED_FIELDS } from "../sim/types";
import { type PackedAncestry } from "../sim/ancestryStore";
import { checkpointAncestry } from "./checkpointAncestry";

function fail(message: string): never {
  throw new Error(`Invalid bacterial checkpoint: ${message}`);
}
function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("object expected");
}
function numbers(value: unknown, length: number, min: number, max: number): void {
  if (
    !Array.isArray(value) ||
    value.length !== length ||
    !value.every((v) => typeof v === "number" && Number.isFinite(v) && v >= min - NOISE && v <= max)
  )
    fail("invalid numeric array");
}
/** Rounding noise a bounded quantity may carry below its bound (one unit in the last place). */
const NOISE = 1e-12;
function finite(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min - NOISE || value > max)
    fail(`invalid number ${String(value)} outside [${min}, ${max}]`);
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): asserts value is number {
  finite(value, min, max);
  if (!Number.isInteger(value)) fail("integer expected");
}
function idOrNull(value: unknown): void {
  if (value !== null) integer(value, 1);
}
function array(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value)) fail("array expected");
}
function validateCell(value: unknown, c: Config): void {
  object(value);
  for (const key of ["id", "lineage", "genome"]) integer(value[key], 1);
  for (const key of ["generation", "born"]) integer(value[key]);
  idOrNull(value.parent);
  finite(value.x, 0, Number(c.width));
  finite(value.y, 0, Number(c.height));
  object(value.body);
  // Light harvesting is zero without the element cycle; every other stock is strictly positive.
  for (const key of BODY_PARTS) finite(value.body[key], key === "photo" ? 0 : 1e-15);
  const body = value.body as Body;
  finite(value.energy, 0, energyCapacity(body, c) + 1e-8);
  finite(value.damage, 0, 1);
  finite(value.reserve, 0, materialCapacity(body, c) + 1e-8);
  finite(value.heading, 0, 2 * Math.PI);
  numbers(value.inputs, INPUTS, -1, 1);
  numbers(value.contacts, 4, 0, 1);
  numbers(value.receptors, 4, 0, 1);
  controller.decodeState(value.brain);
  object(value.action);
  finite(value.action.swim, 0, 1);
  finite(value.action.turn, -1, 1);
  finite(value.action.secrete, 0, 1);
  for (const key of ["toxin", "matrix", "repair"]) finite(value.action[key], 0, 1);
}
function validateRecords(data: Record<string, unknown>): void {
  array(data.genomes);
  array(data.events);
  array(data.sources);
  for (const r of data.genomes) {
    object(r);
    integer(r.id, 1);
    idOrNull(r.parent);
    integer(r.born);
    finite(r.learned, 0, 32);
    decodeGenotype(r.genome);
  }
  validateAncestryRecords(data);
  for (const e of data.events) {
    object(e);
    integer(e.tick);
    integer(e.cell, 1);
    array(e.values);
    numbers(e.values, e.values.length, 0, Number.MAX_SAFE_INTEGER);
    if (!["division", "death", "task", "override"].includes(String(e.kind))) fail("event kind");
  }
  validateDeposits(data);
}
function validateAncestryRecords(data: Record<string, unknown>): void {
  const ancestry = checkpointAncestry(data);
  const expected = Array.isArray(data.ancestry)
    ? data.ancestry.length
    : (data.ancestry as PackedAncestry).count;
  if (ancestry.size !== expected) fail("duplicate identities");
  for (const a of ancestry.values()) {
    object(a);
    integer(a.id, 1);
    idOrNull(a.parent);
    integer(a.lineage, 1);
    integer(a.genome, 1);
    integer(a.born);
    if (a.ended !== null) integer(a.ended);
    if (!["alive", "division", "starvation", "damage", "disturbance"].includes(String(a.cause)))
      fail("ancestry cause");
  }
}
function validateDeposits(data: Record<string, unknown>): void {
  array(data.sources);
  for (const s of data.sources) {
    object(s);
    finite(s.x);
    finite(s.y);
    for (const key of ["remaining", "foodA", "foodB", "rate", "wait"]) finite(s[key]);
    finite(s.radius, 1e-15);
  }
  array(data.patchCenters);
  const c = data.config as Config;
  const regions = c.resourceLayout === "localized" ? c.landscapeRegions : 3;
  if (data.patchCenters.length !== regions) fail("invalid landscape regions");
  for (const p of data.patchCenters) {
    object(p);
    finite(p.x);
    finite(p.y);
  }
  validateHabitats(data, c);
}
function validateHabitats(data: Record<string, unknown>, c: Config): void {
  array(data.habitats);
  const count = c.resourceLayout === "localized" ? c.sourceCount : 0;
  if (data.habitats.length !== count) fail("invalid habitat count");
  for (const h of data.habitats) {
    object(h);
    finite(h.x, 0, c.width);
    finite(h.y, 0, c.height);
    finite(h.radius, 1e-15);
    finite(h.richness, 1e-15);
    finite(h.share, 0, 1);
  }
}
/** Levers whose absence in a save means off (zero); their physics is unchanged when off. */
const OFF_WHEN_ABSENT = ["preyYield", "transferRate", "sharingRate"] as const;
function validateFields(data: Record<string, unknown>): Config {
  object(data.config);
  for (const key of OFF_WHEN_ABSENT) if (!(key in data.config)) data.config[key] = 0;
  for (const key of Object.keys(DEFAULT_CONFIG))
    if (!(OPTIONAL_CONFIG as readonly string[]).includes(key) && !(key in data.config))
      fail(`missing config ${key}`);
  validateConfig(data.config as Config);
  finite(data.config.width, 8, 1000000);
  finite(data.config.height, 8, 1000000);
  const size = data.config.width * data.config.height;
  if (size > 1e6) fail("field too large");
  for (const key of PERSISTED_FIELDS) numbers(data[key], size, 0, 1e100);
  return data.config as Config;
}
const SIGNED_LEDGER = new Set(["oxygenExchanged", "carbonExchanged"]);
/** Counters of levers that are off when absent; a save without them has counted nothing. */
const ZERO_WHEN_ABSENT = new Set([
  "preyed",
  "transfers",
  "shared",
  "disturbances",
  "disturbanceDeaths",
]);
function validateLedger(value: unknown): void {
  object(value);
  for (const key of ZERO_WHEN_ABSENT) if (!(key in value)) value[key] = 0;
  // Net atmosphere exchanges are the signed ledger entries.
  for (const key of Object.keys(createLedger()))
    finite(value[key], SIGNED_LEDGER.has(key) ? -Number.MAX_SAFE_INTEGER : 0);
}
function validateIdentity(data: Record<string, unknown>): void {
  for (const key of ["tick", "nextCell", "nextGenome"]) integer(data[key]);
  if (Number(data.nextCell) > (data.config as Config).maxAncestryRecords + 1)
    fail("ancestry limit");
  integer(data.seed, -2147483648, 4294967295);
  for (const name of ["rng", "environmentRng", "geneticRng"]) {
    const rng = data[name];
    object(rng);
    integer(rng.value, 1, 4294967295);
  }
  if (data.stopReason !== null && typeof data.stopReason !== "string") fail("stop reason");
}
export function validateSnapshot(data: unknown): asserts data is Checkpoint {
  object(data);
  if (data.substrate !== "bacteria-xy" || data.version !== 8)
    fail("unsupported substrate or version; requires bacterial checkpoint v8");
  const config = validateFields(data);
  validateIdentity(data);
  validateLedger(data.ledger);
  array(data.cells);
  for (const cell of data.cells) validateCell(cell, config);
  validateRecords(data);
  validateInterventions(data.interventions);
  validateRelations(data as Checkpoint);
}

function validateInterventions(value: unknown): void {
  array(value);
  for (const intervention of value) {
    object(intervention);
    integer(intervention.tick);
    integer(intervention.cell, 1);
    integer(intervention.previous, 0, 255);
    integer(intervention.value, 0, 255);
  }
}
