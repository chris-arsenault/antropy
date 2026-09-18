"""Compare registered v19/v20 observations without advancing either simulation."""
import argparse
from collections import Counter
import json
from pathlib import Path

import numpy as np

from evolve_chemistry import records
from seed_cycle_report import chemical, extrema


def top(values):
    return sorted(enumerate(values), key=lambda item: -item[1])[:10]


def point(sample):
    cells, summary = sample["cells"], sample["summary"]
    field = sample["environment"]["extracellular"]
    amounts = field["species"]
    shares = np.asarray(amounts) / field["amount"]
    groups = sample["groups"]
    seconds = sum(g["organismSeconds"] for g in groups)
    reactions = Counter()
    for group in groups:
        for edge in group["reactions"]:
            reactions[f'{edge["species"]}>{edge["product"]}'] += edge["amount"]
    flows = {k: chemical(sample, k) for k in ["imported", "exported", "consumed", "produced"]}
    assert abs(sum(flows["imported"]) - summary["ledger"]["flows"]["imported"]) < 1e-6
    body = sample.get("bodyChemistry")
    if body:
        assert abs(sum(body["bound"]) - summary["biomass"]) < 1e-6
    return {
        "tick": sample["tick"], "population": len(cells), "biomass": summary["biomass"],
        "generation": summary["generation"], "ledger": summary["ledger"],
        "field186": amounts[186], "share186": float(shares[186]),
        "fieldAmount": field["amount"], "fieldPotential": field["potential"],
        "fieldEffectiveSpecies": float(1 / np.sum(shares ** 2)), "fieldTop": top(amounts),
        "chemical": flows, "reactions": dict(reactions), "organismSeconds": seconds,
        "damageSeconds": sum(g["damageSeconds"] for g in groups),
        "slowedSeconds": sum(g["slowedSeconds"] for g in groups),
        "halfSpeedArea": sample["environment"]["halfSpeedArea"],
        "families": dict(Counter(c["lineage"] for c in cells)),
        "distinctSequences": sample["populationTraits"]["population"]["evolution"]["distinctSequences"],
        "bodyMean": np.mean([h["body"] for h in sample["habitats"]], axis=0).tolist() if cells else [],
        "bodyChemistry": body,
        "meanDamage": float(np.mean([c["damage"] for c in cells])) if cells else None,
        "meanMass": summary["biomass"] / len(cells) if cells else None,
        "resources": sample["resources"],
    }


def epoch(points, start, end, feed):
    selected = [p for p in points if start <= p["tick"] <= end]
    a, b = selected[0], selected[-1]
    dt = b["tick"] - a["tick"]
    means = {
        k: sum((x[k] + y[k]) * .5 * (y["tick"] - x["tick"])
               for x, y in zip(selected, selected[1:])) / dt
        for k in ["population", "biomass", "field186", "share186", "fieldEffectiveSpecies"]
    }
    changes = {k: np.asarray(b["chemical"][k]) - a["chemical"][k] for k in b["chemical"]}
    flow_summary = {}
    for k, values in changes.items():
        total = float(sum(values))
        flow_summary[k] = {
            "total": total, "186": float(values[186]), "feed": float(sum(values[s] for s in feed)),
            "feedShare": float(sum(values[s] for s in feed) / total) if total else None,
            "top": [(int(s), float(q)) for s, q in top(values)],
        }
    seconds = b["organismSeconds"] - a["organismSeconds"]
    reactions = {k: q - a["reactions"].get(k, 0) for k, q in b["reactions"].items()}
    return {
        "start": start, "end": end, "means": means,
        "populationRange": [min(p["population"] for p in selected), max(p["population"] for p in selected)],
        "divisions": b["ledger"]["divisions"] - a["ledger"]["divisions"],
        "deaths": b["ledger"]["deaths"] - a["ledger"]["deaths"],
        "chemical": flow_summary,
        "reactionsTop": sorted(reactions.items(), key=lambda x: -x[1])[:12],
        "flows": {k: q - a["ledger"]["flows"][k] for k, q in b["ledger"]["flows"].items()},
        "meanDamageOverCellTime": (b["damageSeconds"] - a["damageSeconds"]) / seconds,
        "fractionCellTimeSlowed": (b["slowedSeconds"] - a["slowedSeconds"]) / seconds,
    }


def case(directory):
    manifest = json.loads((directory / "manifest.json").read_text())
    result = json.loads((directory / "result.json").read_text())
    points = [point(s) for s in records(directory / "samples.jsonl")]
    last = points[-1]["tick"]
    epochs = [epoch(points, start, min(start + 10000, last), manifest["config"]["sourceSpecies"])
              for start in range(0, last, 10000)]
    return {"manifest": manifest, "result": {k: v for k, v in result.items() if k not in ["series", "frames"]},
            "points": points, "epochs": epochs, "extrema": extrema(points)}


def plot(cases, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(3, 2, figsize=(12, 10), sharex=True, constrained_layout=True)
    metrics = [("population", "Living cells", 1), ("biomass", "Living body mass", 1),
               ("field186", "Extracellular #186 amount", 1), ("share186", "#186 share of field (%)", 100),
               ("fieldEffectiveSpecies", "Chemical evenness (1 / sum of squared shares)", 1),
               ("meanMass", "Mean living cell mass", 1)]
    for ax, (metric, label, scale) in zip(axes.flat, metrics):
        for name, data in cases.items():
            ax.plot([p["tick"] for p in data["points"]],
                    [p[metric] * scale for p in data["points"]], label=name)
        ax.set_ylabel(label)
        ax.grid(alpha=.2)
    axes[0, 0].legend()
    for ax in axes[-1]:
        ax.set_xlabel("Tick")
    fig.suptitle("Seed27: matched v19 and v20 kernels; unchanged defaults")
    fig.savefig(output / "comparison.png", dpi=160)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    cases = {name: case(args.study / name) for name in ["main-v19", "main-v20"]}
    a, b = [x["manifest"] for x in cases.values()]
    assert a["config"] == b["config"] and a["chemistry"] == b["chemistry"]
    args.output.mkdir(exist_ok=False)
    (args.output / "report.json").write_text(json.dumps(cases, allow_nan=False))
    compact = {name: {"manifest": {k: v for k, v in data["manifest"].items() if k != "chemistry"},
                      "result": data["result"], "epochs": data["epochs"], "extrema": data["extrema"],
                      "selected": [p for p in data["points"] if p["tick"] % 10000 == 0]}
               for name, data in cases.items()}
    horizon = min(data["points"][-1]["tick"] for data in cases.values()) // 10000 * 10000
    compact["comparison"] = {
        "commonCompletedHorizon": horizon,
        "cases": {name: {
            "overall": epoch(data["points"], 0, horizon, data["manifest"]["config"]["sourceSpecies"]),
            "endpoint": next(p for p in data["points"] if p["tick"] == horizon),
        } for name, data in cases.items()},
    }
    (args.output / "findings.json").write_text(json.dumps(compact, indent=2, allow_nan=False))
    plot(cases, args.output)
    print(json.dumps({name: {"tick": data["points"][-1]["tick"], "ledger": data["result"]["ledgerId"]}
                      for name, data in cases.items()}))


if __name__ == "__main__":
    main()
