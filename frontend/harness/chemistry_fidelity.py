"""Historical v9 quantization comparison; reads saved artifacts only.

The v10 kernel has no quantization knob. Its exact continuation, mesh and
physiology sensitivity evidence is recorded in numerical-results.md.
"""

import argparse
import base64
import json
import struct
from pathlib import Path


def numeric_difference(left, right):
    if isinstance(left, dict) and isinstance(right, dict):
        if left.keys() != right.keys():
            raise ValueError("Changed record keys")
        return max((numeric_difference(left[k], right[k]) for k in left), default=0)
    if isinstance(left, list) and isinstance(right, list):
        if len(left) != len(right):
            raise ValueError("Changed sequence length")
        return max((numeric_difference(a, b) for a, b in zip(left, right)), default=0)
    if isinstance(left, (int, float)) and isinstance(right, (int, float)):
        return abs(left - right)
    if left != right:
        raise ValueError("Changed categorical state")
    return 0


def cell_errors(left, right):
    if [c["id"] for c in left] != [c["id"] for c in right]:
        raise ValueError("Different living organisms")
    maxima = {}
    for a, b in zip(left, right):
        for key in a:
            if key in ("inventory", "localMixture"):
                x, y = dict(a[key]), dict(b[key])
                error = max((abs(x.get(s, 0) - y.get(s, 0)) for s in x.keys() | y.keys()), default=0)
            else:
                error = numeric_difference(a[key], b[key])
            maxima[key] = max(maxima.get(key, 0), error)
    return maxima


def field_errors(left, right):
    a, b = dict(left), dict(right)
    zero = (0.0,) * 64
    errors = {}
    for key in sorted(a.keys() | b.keys()):
        x = struct.unpack("<64d", base64.b64decode(a[key])) if key in a else zero
        y = struct.unpack("<64d", base64.b64decode(b[key])) if key in b else zero
        record = errors.setdefault(key % 256, {"l1": 0, "maximum": 0})
        for first, second in zip(x, y):
            error = abs(first - second)
            record["l1"] += error
            record["maximum"] = max(record["maximum"], error)
    return errors


def trace_errors(reference, candidate):
    files = [p / "traces.json" for p in (reference, candidate)]
    if not any(p.exists() for p in files):
        return None
    left, right = [json.loads(p.read_text()) for p in files]
    if [f["tick"] for f in left] != [f["tick"] for f in right]:
        raise ValueError("Different trace horizons")
    maxima = {}
    for a, b in zip(left, right):
        for key, error in cell_errors(a["cells"], b["cells"]).items():
            maxima[key] = max(maxima.get(key, 0), error)
    return maxima


def compare(reference, candidate, tolerance=1e-12, field_tolerance=1e-12):
    a = json.loads((reference / "final.json").read_text())
    b = json.loads((candidate / "final.json").read_text())
    if a["tick"] != b["tick"] or a["chemistry"] != b["chemistry"]:
        raise ValueError("Different horizon or physical chemistry")
    physical = lambda c: {k: v for k, v in c.items() if k != "chemicalResolution"}
    if physical(a["config"]) != physical(b["config"]):
        raise ValueError("Different physical configuration")
    cells = cell_errors(a["cells"], b["cells"])
    fields = field_errors(a["chemicals"], b["chemicals"])
    traces = trace_errors(reference, candidate)
    ledger = {k: abs(v - b["ledger"][k]) for k, v in a["ledger"].items()
              if k not in ("numericalMaterial", "numericalEnergy")}
    exact = {k: a[k] == b[k] for k in ("genomes", "ancestry", "sources", "rng", "geneticRng", "environmentRng", "stopReason")}
    return {
        "reference": str(reference), "candidate": str(candidate), "tick": a["tick"],
        "referenceResolution": a["config"]["chemicalResolution"],
        "resolution": b["config"]["chemicalResolution"], "exact": exact,
        "cellMaximumAbsoluteError": cells, "perSpeciesFieldError": fields,
        "sampledTraceMaximumAbsoluteError": traces,
        "fieldL1Error": sum(v["l1"] for v in fields.values()),
        "physicalLedgerMaximumAbsoluteError": max(ledger.values(), default=0),
        "numericalMaterial": b["ledger"]["numericalMaterial"],
        "numericalEnergy": b["ledger"]["numericalEnergy"],
        "absoluteTolerance": tolerance, "fieldL1Tolerance": field_tolerance,
        "withinAbsoluteTolerance": all(exact.values()) and max(cells.values(), default=0) < tolerance
        and max(ledger.values(), default=0) < tolerance and sum(v["l1"] for v in fields.values()) < field_tolerance
        and max((traces or {}).values(), default=0) < tolerance,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path)
    parser.add_argument("candidates", nargs="+", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--pairs", action="store_true", help="Compare matching case directories")
    parser.add_argument("--tolerance", type=float, default=1e-12)
    parser.add_argument("--field-tolerance", type=float, default=1e-12)
    args = parser.parse_args()
    if args.pairs:
        names = sorted(p.name for p in args.reference.iterdir() if (p / "final.json").is_file())
        results = [compare(args.reference / name, candidate / name, args.tolerance, args.field_tolerance)
                   for candidate in args.candidates for name in names]
    else:
        results = [compare(args.reference, candidate, args.tolerance, args.field_tolerance) for candidate in args.candidates]
    with args.output.open("x") as target:
        json.dump(results, target, indent=2)
    print(json.dumps([{k: v for k, v in result.items() if k != "perSpeciesFieldError"}
                      for result in results], indent=2))


if __name__ == "__main__":
    main()
