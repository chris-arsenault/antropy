"""Reduce registered causal runs; no simulation advancement or parameter selection."""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).parent / "artifacts"


def read(path):
    return json.loads(path.read_text())


def from_sample(sample, offset):
    field = sample["environment"]["extracellular"]
    return {
        "tick": sample["tick"],
        "population": sample["summary"]["population"],
        "field186": field["species"][186],
        "share186": field["species"][186] / field["amount"] if field["amount"] else 0,
        "chemical": {
            key: [a + b for a, b in zip(values, offset.get(key, [0] * 256))]
            for key, values in sample["chemical"].items()
        },
    }


def trajectory(name, old):
    directories = [ROOT / "186-v21-common"] if name == "new" else [
        ROOT / f"186-causal-{name}-{part}" for part in ["pilot", "continuation"]
    ]
    points = [p for p in old if p["tick"] < 2500] if name == "remove-allele" else []
    offset = next(p["chemical"] for p in old if p["tick"] == 2500) if points else {}
    runs = []
    for directory in directories:
        run = read(directory / "result.json")
        if run["stop"] != "horizon":
            raise ValueError(f"Incomplete registered run: {directory}: {run['stop']}")
        for sample in run["samples"]:
            point = from_sample(sample, offset)
            if points and points[-1]["tick"] == point["tick"]:
                points[-1] = point
            else:
                points.append(point)
        offset = points[-1]["chemical"]
        runs.append({key: value for key, value in run.items() if key != "samples"})
    return points, runs


def reduce(points):
    a = next(p for p in points if p["tick"] == 10000)
    b = next(p for p in points if p["tick"] == 20000)
    produced = [y - x for x, y in zip(a["chemical"]["produced"], b["chemical"]["produced"])]
    final = {k: b[k] for k in ["tick", "population", "field186", "share186"]}
    return {
        "final": final,
        "lateProduced186": produced[186],
        "lateTotalProduced": sum(produced),
        "lateProductShare186": produced[186] / sum(produced),
        "points": [{k: p[k] for k in final} for p in points if p["tick"] <= 20000],
    }


def main():
    output = ROOT / "186-causal-readout"
    output.mkdir()
    old = read(ROOT / "bound-material-impact-20260917/readout/report.json")["main-v20"]["points"]
    results = {"old": reduce(old)}
    for name in ["new", "old-mutation", "rng-shift", "remove-allele"]:
        points, runs = trajectory(name, old)
        results[name] = {**reduce(points), "runs": runs}
    (output / "findings.json").write_text(json.dumps(results, indent=2) + "\n")
    fig, axes = plt.subplots(1, 2, figsize=(13, 5), sharey=True)
    labels = {
        "old": "Before symmetry",
        "new": "After symmetry",
        "old-mutation": "New rules + old mutation",
        "rng-shift": "New rules + one genetic draw skipped",
        "remove-allele": "Old rules, one mutation undone",
    }
    for ax, names in zip(axes, [["old", "new", "old-mutation", "rng-shift"], ["old", "remove-allele"]]):
        for name in names:
            points = results[name]["points"]
            ax.plot([p["tick"] for p in points], [100 * p["share186"] for p in points], label=labels[name])
        ax.set_xlabel("Tick")
        ax.grid(alpha=0.25)
        ax.legend(fontsize=8)
    axes[0].set_ylabel("Dissolved #186 share (%)")
    axes[0].set_title("Version and genetic-stream controls")
    axes[1].set_title("Counterfactual: remove the tick-2960 enzyme mutation")
    fig.tight_layout()
    fig.savefig(output / "causal-trajectories.png", dpi=160)
    print(json.dumps({k: {x: y for x, y in v.items() if x not in ["points", "runs"]} for k, v in results.items()}, indent=2))


if __name__ == "__main__":
    main()
