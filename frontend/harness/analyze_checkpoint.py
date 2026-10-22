"""Reduce local paired captures; keep generated numerical output in the artifact tree."""
import argparse
import json
import math
from pathlib import Path

from checkpoint_compare import interval


def distance(a, b, extent):
    delta = [(x - y + size / 2) % size - size / 2
             for x, y, size in zip(a, b, extent)]
    return math.hypot(*delta)


def native(path):
    result = json.loads((path / "result.json").read_text())
    registration = json.loads((path / "registration.json").read_text())
    extent = [result["config"]["width"], result["config"]["height"]]
    first = None
    last = None
    previous_sources = None
    renewals = {}
    starts = {}
    ends = {}
    switches = set()
    source_relative = 0.0
    samples = 0
    for line in (path / "samples.jsonl").open():
        sample = json.loads(line)
        samples += 1
        if first is None:
            first = sample
        sources = {s["id"]: s for s in sample["sources"]}
        if previous_sources:
            for key, source in sources.items():
                # Admission changes stock, never nominal allowance. A reset is a refill.
                if source["allowance"] > previous_sources[key]["allowance"] + 1e-9:
                    renewals[key] = renewals.get(key, 0) + 1
        for cell in sample["cells"]:
            key = cell["id"]
            source = cell["nearestSource"][0] if cell["nearestSource"] else None
            if key not in starts:
                starts[key] = (cell["position"], source,
                               sources[source]["position"] if source is not None else None)
            start, original_source, source_start = starts[key]
            if source != original_source:
                switches.add(key)
            if original_source is not None:
                before = [a-b for a, b in zip(start, source_start)]
                after = [a-b for a, b in zip(cell["position"], sources[original_source]["position"])]
                source_relative = max(source_relative, distance(before, after, extent))
            ends[key] = cell["position"]
        previous_sources = sources
        last = sample
    initial = {c["id"] for c in first["cells"]}
    final = {c["id"] for c in last["cells"]}
    result["interval"] = interval(first["summary"], last["summary"])
    result["coverage"] = {
        "samples": samples, "initialFocal": len(initial),
        "originalFocalAliveAtEnd": len(initial & final),
        "livingTrackedAtEnd": last["livingTracked"],
        "allTrackedIds": last["trackedIds"],
        "recordedBirths": sum(1 for _ in (path / "births.jsonl").open()),
        "observedSourceRenewals": sum(renewals.values()),
        "sourcesRenewed": len(renewals), "maximumRenewalsPerSource": max(renewals.values(), default=0),
        "maximumIndividualNetDisplacement": max(
            (distance(starts[key][0], position, extent) for key, position in ends.items()), default=0),
        "maximumMotionRelativeToOriginalSource": source_relative,
        "idsChangingNearestSource": len(switches),
        "movementMeaning": "Paths include passive motion; nearest-source changes are candidates, not verified exchange or founding. Untracked habitat occupancy and food edges are incomplete.",
        "payerMeaning": "World accounts include ended cells. Sampled cell.flows describe one step; sparse samples cannot close a focal lifetime expense account.",
        "mapFingerprints": registration["mapFingerprints"],
    }
    frozen_path = path / "frozen.json"
    if frozen_path.exists():
        probes = json.loads(frozen_path.read_text())
        result["frozen"] = {}
        for family in ["effortDifferenceNorm", "slowDifferenceNorm"]:
            names = {name for probe in probes for name in probe[family]}
            for name in sorted(names):
                values = [probe[family][name] for probe in probes if probe[family][name] is not None]
                result["frozen"][name] = {
                    "available": len(values), "nonzero": sum(value > 1e-10 for value in values),
                    "maximum": max(values, default=None)}
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    allowed = Path("frontend/harness/artifacts").resolve()
    if allowed not in args.output.resolve().parents:
        parser.error("Generated reductions must stay inside the ignored artifact tree")
    report = {"screen": {}, "interaction": {}, "native": {}}
    for batch in ["screen", "interaction"]:
        for path in (args.root / batch).glob("*/interval.json"):
            before = json.loads((path.parent / "before.json").read_text())
            after = json.loads((path.parent / "capture/ecology.json").read_text())["current"]
            report[batch][path.parent.name] = interval(before, after)
    for path in sorted(args.root.glob("renewal-*/result.json")):
        report["native"][path.parent.name] = native(path.parent)
    with args.output.open("x") as out:
        json.dump(report, out, separators=(",", ":"))
        out.write("\n")
    print(json.dumps({name: {
        "modelSeconds": row["interval"]["modelSeconds"],
        "biomassChange": row["interval"]["biomassChange"],
        "marginAfterDivision": row["interval"]["marginAfterDivision"],
        "coverage": row["coverage"]} for name, row in report["native"].items()}))


if __name__ == "__main__":
    main()
