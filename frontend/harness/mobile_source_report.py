"""Read short source experiments; never advances or selects a simulation genotype."""
import argparse
import json
import math
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def quantile(values, q):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int((len(ordered) - 1) * q))] if ordered else 0


def point(sample, initial, config):
    sources = sample["environment"]["sources"]
    delta = lambda a, b, size: (a - b + size / 2) % size - size / 2
    distances = [math.hypot(delta(s["habitat"]["x"], a["habitat"]["x"], config["width"]),
                            delta(s["habitat"]["y"], a["habitat"]["y"], config["height"]))
                 for s, a in zip(sources, initial)]
    relative = [d / s["habitat"]["radius"] for d, s in zip(distances, sources)]
    outputs = sample["environment"]["sourceResponse"]
    rate = sum(q for o in outputs for _, q in o["outputRate"])
    transformed_rate = sum(q for o in outputs for s, q in o["outputRate"] if s not in config["sourceSpecies"])
    groups = sample["groups"]
    imported = [sum(g["chemical"]["imported"][s] for g in groups) for s in range(256)]
    total = sum(imported)
    nonfeed = sum(v for s, v in enumerate(imported) if s not in config["sourceSpecies"])
    ledger = sample["summary"]["ledger"]
    return {
        "tick": sample["tick"], "population": sample["population"],
        "generation": sample["summary"]["generation"],
        "meanDisplacement": sum(distances) / max(1, len(distances)),
        "medianDisplacement": quantile(distances, 0.5), "p90Displacement": quantile(distances, 0.9),
        "medianRadiusDisplacement": quantile(relative, 0.5),
        "fractionBeyondRadius": sum(d >= 1 for d in relative) / max(1, len(relative)),
        "prospectiveNonFeedOutputFraction": transformed_rate / rate if rate else 0,
        "conversionEventsPerReleasedUnit": ledger["sourceConverted"] / ledger["sourceReleased"] if ledger["sourceReleased"] else 0,
        "sourceDistance": ledger["sourceDistance"], "sourceConverted": ledger["sourceConverted"],
        "sourceHeat": ledger["sourceHeat"], "imported": total,
        "nonFeedImportFraction": nonfeed / total if total else 0,
        "constructed": ledger["flows"]["constructed"], "motorWork": ledger["flows"]["motors"],
        "cellDistance": ledger["flows"]["distance"], "divisions": ledger["divisions"],
        "sourcePositions": [[s["habitat"]["x"], s["habitat"]["y"]] for s in sources],
        "resources": sample["resources"],
    }


def read_case(path):
    manifest, result = load(path / "manifest.json"), load(path / "result.json")
    points = []
    with (path / "samples.jsonl").open() as stream:
        for line in stream:
            sample = json.loads(line)
            if not points:
                initial = sample["environment"]["sources"]
            points.append(point(sample, initial, manifest["config"]))
    signals = {
        "medianQuarterRadius": lambda p: p["medianRadiusDisplacement"] >= 0.25,
        "oneTenthConversionPerReleasedUnit": lambda p: p["conversionEventsPerReleasedUnit"] >= 0.1,
        "tenPercentBeyondRadius": lambda p: p["fractionBeyondRadius"] >= 0.1,
    }
    return {
        "name": path.name, "ledgerId": result["ledgerId"], "config": manifest["config"],
        "stop": result["stop"], "status": manifest["status"], "final": points[-1],
        "ticksPerSecond": result["final"]["tick"] / (result["wallMs"] / 1000),
        "wallSeconds": result["wallMs"] / 1000,
        "maxEnergyResidual": result["maxResidual"], "maxMaterialResidual": result["maxMaterialResidual"],
        "sampledPeakRss": max(p["resources"]["rss"] for p in points),
        "sampledPeakWasm": max(p["resources"]["wasm"] for p in points),
        "firstObserved": {k: next((p["tick"] for p in points if f(p)), None) for k, f in signals.items()},
        "harnessUnchanged": manifest["harnessDigest"] == manifest["harnessDigestAfter"],
        "sourceDigest": manifest["sourceDigest"], "binaryDigest": manifest["binaryDigest"],
        "points": points,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    cases = [read_case(p) for p in sorted(args.study.glob("seed*")) if (p / "result.json").exists()]
    args.output.mkdir(exist_ok=False)
    report = {"cases": cases, "probes": load(args.study / "probes.json"),
        "limits": "Short calibration establishes response and access, not evolved strategy or sustained ecology. Prospective output is an instantaneous rate; imports identify chemical IDs, not atom provenance. Memory peaks are sampled."}
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    figure, axes = plt.subplots(2, 3, figsize=(14, 8), constrained_layout=True)
    metrics = [("medianRadiusDisplacement", "Median source displacement / radius"),
        ("conversionEventsPerReleasedUnit", "Inventory conversion events / released material"), ("population", "Living cells"),
        ("constructed", "Cumulative constructed material"), ("imported", "Cumulative cell imports"),
        ("nonFeedImportFraction", "Non-feed chemical ID fraction of imports")]
    for case in cases:
        for axis, (metric, title) in zip(axes.flat, metrics):
            axis.plot([p["tick"] for p in case["points"]], [p[metric] for p in case["points"]], label=case["name"])
            axis.set_title(title); axis.set_xlabel("Tick"); axis.grid(alpha=0.2)
    axes[0, 0].legend(fontsize=6)
    figure.savefig(args.output / "trajectories.png", dpi=150)
    plt.close(figure)
    rows = ["# Short mobile-source study", "", report["limits"], "",
        "| Case | Ticks | Stop | Living | Median displacement/radius | Conversion events/released unit | Built material | Ticks/s |",
        "| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |"]
    for case in cases:
        p = case["final"]
        rows.append(f'| {case["name"]} | {p["tick"]} | {case["stop"]} | {p["population"]} | {p["medianRadiusDisplacement"]:.3f} | {p["conversionEventsPerReleasedUnit"]:.3f} | {p["constructed"]:.2f} | {case["ticksPerSecond"]:.1f} |')
    rows += ["", "![Short source trajectories](trajectories.png)", "", "Exact config, onset times and sampled trajectories are in report.json."]
    (args.output / "README.md").write_text("\n".join(rows) + "\n")


if __name__ == "__main__":
    main()
