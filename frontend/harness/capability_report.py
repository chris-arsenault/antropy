"""Local analysis of the registered capability investigation; never advances a world.

From frontend: python3 harness/capability_report.py
Optional arguments: short-case root, pilot root. Existing generated reports may be regenerated.
"""
import hashlib
import json
import statistics
import sys
from collections import Counter
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def read(path):
    return json.loads(path.read_text())


def percentage(value, denominator):
    return 100 * value / denominator if denominator else None


def summarize(directory):
    manifest = read(directory / "manifest.json")
    result = read(directory / "result.json")
    if manifest["sourceDigest"] != result["sourceDigestAfter"]:
        raise ValueError(f"Source changed during {directory}")
    initial, final = read(directory / "initial.json"), read(directory / "final.json")
    labels = manifest["specification"]["variants"]
    groups = []
    for group in sorted(result["groups"], key=lambda g: g["genome"]):
        g = dict(group)
        label = labels[g["genome"]-1] if isinstance(labels, list) else labels[str(g["genome"])]
        flows = g["flows"]
        material = flows.get("food_a", 0) + flows.get("food_b", 0)
        energy = material * manifest["config"]["nutrientEnergy"]
        g.update(label=label, foodBPercentAbsorbed=percentage(flows.get("food_b", 0), material),
                 repairPercentAbsorbedEnergy=percentage(flows.get("repair", 0), energy),
                 learningPercentAbsorbedEnergy=percentage(flows.get("learning", 0), energy),
                 matrixPercentAbsorbedMaterial=percentage(flows.get("matrix", 0), material),
                 toxinPercentAbsorbedMaterial=percentage(flows.get("toxin", 0), material))
        groups.append(g)
    return {
        "case": directory.name, "sourceDigest": result["sourceDigestAfter"],
        "ticks": result["ticks"], "stop": result["stop"], "wallMs": result["wallMs"],
        "groups": groups, "initialPopulation": len(initial["cells"]),
        "finalPopulation": len(final["cells"]),
        "maxLivingGeneration": max((c["generation"] for c in final["cells"]), default=None),
        "sourceInput": final["ledger"]["supplied"],
        "maxEnergyResidualPercent": result["maxEnergyResidualPercent"],
        "maxMaterialResidualPercent": result["maxMaterialResidualPercent"],
        "mutationEvents": final["ledger"]["mutations"],
        "learnedBirths": final["ledger"]["learnedBirths"],
    }


def summarize_root(root):
    return [summarize(path.parent) for path in sorted(root.glob("*/result.json"))]


def pilot_pairs(root):
    checks = []
    for seed in (702, 703):
        paths = [root / f"processing-invasion-{food}-{seed}" / "final.json" for food in ("A", "B")]
        if not all(p.exists() for p in paths):
            continue
        a, b = map(read, paths)
        geometry = lambda w: [{k: v for k, v in s.items() if k not in ("foodA", "foodB")} for s in w["sources"]]
        checks.append({"seed": seed, "sameTick": a["tick"] == b["tick"],
                       "sameEnvironmentRng": a["environmentRng"] == b["environmentRng"],
                       "sameSourceGeometry": geometry(a) == geometry(b),
                       "sourceInputDifference": a["ledger"]["supplied"] - b["ledger"]["supplied"]})
    return checks


def pilot_chart(root, output):
    figure, axes = plt.subplots(1, 2, figsize=(11, 4), sharey=True)
    for ax, seed in zip(axes, (702, 703)):
        for food, color in (("A", "#bd6700"), ("B", "#0874ac")):
            path = root / f"processing-invasion-{food}-{seed}" / "traces.json"
            if not path.exists():
                continue
            frames = read(path)
            ax.plot([f["tick"] for f in frames],
                    [percentage(sum(c["group"] == 1 for c in f["cells"]), len(f["cells"])) for f in frames],
                    color=color, label=f"Incoming {food}")
        ax.axhline(12.5, linestyle=":", color="gray", label="Initial 12.5%")
        ax.set(title=f"Seed {seed}", xlabel="Tick", ylabel="Observed B-investment variant / living cells (%)", ylim=(0, 100))
        ax.legend()
    figure.suptitle("Selection of an existing evolved allele; mutation and learning disabled")
    figure.tight_layout()
    figure.savefig(output / "selection-pilots.png", dpi=150)
    plt.close(figure)


def capability_chart(root):
    figure, axes = plt.subplots(1, 2, figsize=(11, 4))
    directory = root / "evolved-access-brain-reversion-false"
    frames = read(directory / "traces.json")
    initial = read(directory / "initial.json")
    ax = axes[0]
    ax.imshow(np.asarray(initial["nutrient"]).reshape(32, 32), origin="lower",
              extent=(-.5, 31.5, -.5, 31.5), cmap="Greys", alpha=.6)
    for founder in frames[0]["cells"]:
        points = [(c["x"], c["y"]) for f in frames if f["tick"] <= 150
                  for c in f["cells"] if c["id"] == founder["id"]]
        x, y = zip(*points)
        ax.plot(x, y, color="#0874ac" if founder["group"] == 1 else "#bd6700", linewidth=1)
    ax.add_patch(plt.Circle((16, 16), 2, fill=False, linestyle=":", color="black"))
    ax.set(xlim=(5, 27), ylim=(5, 27), aspect="equal", title="Same body genes; founder paths through tick 150\nBlue: evolved brain. Orange: ancestral brain.")
    frames = read(root / "evolved-processing-uniformB-false" / "traces.json")
    ax = axes[1]
    for group, color, label in ((1, "#0874ac", "Observed B-investment allele"), (2, "#bd6700", "Ancestral processing targets")):
        ax.plot([f["tick"] for f in frames],
                [100*statistics.mean(c["body"]["transportB"]/c["body"]["core"] for c in f["cells"] if c["group"] == group) for f in frames],
                color=color, label=label)
    ax.set(xlabel="Tick", ylabel="Built B processing / core (%)", title="Same initial bodies; ordinary paid growth")
    ax.legend()
    figure.tight_layout()
    figure.savefig(root / "evolved-capabilities.png", dpi=150)
    plt.close(figure)


def table(rows):
    lines = ["| Case | Variant | Living | Divisions / initial cell | A uptake / offer % | B uptake / offer % | Motors / absorbed energy % | Repair / absorbed energy % | Matrix / absorbed material % |",
             "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    def fmt(value):
        return "—" if value is None else f"{value:.3f}"
    for r in rows:
        for g in r["groups"]:
            values = [g[k] for k in ("living", "divisionsPerInitialCell", "offeredFoodACapturedPercent",
                      "offeredFoodBCapturedPercent", "motorPercentAbsorbedEnergy", "repairPercentAbsorbedEnergy", "matrixPercentAbsorbedMaterial")]
            lines.append("| " + " | ".join([r["case"], g["label"], *map(fmt, values)]) + " |")
    return "\n".join(lines) + "\n"


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "harness/artifacts/capabilities-2026-09-11")
    pilot_root = Path(sys.argv[2] if len(sys.argv) > 2 else "harness/artifacts/capability-pilots-2026-09-11")
    cases, pilots = summarize_root(root), summarize_root(pilot_root)
    rows = cases + pilots
    data = {"schemaVersion": 1, "reportSourceDigest": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            "shortCases": len(cases), "pilots": len(pilots), "totalTicks": sum(r["ticks"] for r in rows),
            "timedExecutionSeconds": sum(r["wallMs"] for r in rows)/1000,
            "stops": dict(Counter(r["stop"] for r in rows)), "pilotEnvironmentChecks": pilot_pairs(pilot_root),
            "cases": rows}
    (root / "analysis.json").write_text(json.dumps(data, indent=2))
    (root / "tables.md").write_text(table(rows))
    capability_chart(root)
    pilot_chart(pilot_root, root)
    print(json.dumps({k: v for k, v in data.items() if k != "cases"}, indent=2))
    for r in pilots:
        actual = next(g for g in r["groups"] if g["genome"] == 1)
        print(r["case"], "share %", percentage(actual["living"], r["finalPopulation"]),
              "generation", r["maxLivingGeneration"], "N", r["finalPopulation"])


if __name__ == "__main__":
    main()
