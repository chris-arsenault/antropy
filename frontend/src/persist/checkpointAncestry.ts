import { type Ancestor } from "../sim/types";
import { decodeAncestry, type PackedAncestry } from "../sim/ancestryStore";

const decoded = new WeakMap<object, Map<number, Ancestor>>();
/** One decoded store per parsed checkpoint, shared by shape, relation and restore passes. */
export function checkpointAncestry(data: Record<string, unknown>): Map<number, Ancestor> {
  let store = decoded.get(data);
  if (!store) {
    store = decodeAncestry(data.ancestry as Ancestor[] | PackedAncestry);
    decoded.set(data, store);
  }
  return store;
}
