"""Summarize producer/resistant/sensitive contests from saved traces; runs no simulation.

From frontend: python3 harness/rps_report.py harness/artifacts/rps-<date>
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

COLORS = {"producer": "#c0392b", "resistant": "#2471a3", "sensitive": "#7d8a3e",
          "a-specialist": "#2e8b57", "b-specialist": "#1f77b4", "generalist": "#8c564b"}
FALLBACK = ["#e6550d", "#3182bd", "#31a354", "#756bb1", "#636363"]


def color(name, index):
    return COLORS.get(name, FALLBACK[index % len(FALLBACK)])


def read(path):
    return json.loads(path.read_text())


def series(directory):
    manifest, frames = read(directory / "manifest.json"), read(directory / "traces.json")
    names = manifest["specification"]["variants"]
    ticks = [f["tick"] for f in frames]
    counts = {name: [] for name in names.values()}
    for f in frames:
        living = {name: 0 for name in names.values()}
        for c in f["cells"]:
            living[names[str(c["group"])]] += 1
        for name, n in living.items():
            counts[name].append(n)
    return ticks, counts


def report(root):
    cases = sorted(p.parent for p in root.glob("*/result.json"))
    if not cases:
        raise ValueError("No rps results under case directories")
    figure, axes = plt.subplots(len(cases), 1, figsize=(9, 2.6 * len(cases)), squeeze=False)
    rows = []
    for ax, directory in zip(axes.flat, cases):
        result, manifest = read(directory / "result.json"), read(directory / "manifest.json")
        if result["sourceDigestAfter"] != manifest["sourceDigest"]:
            raise ValueError(f"Source changed: {directory}")
        ticks, counts = series(directory)
        total = [sum(v[i] for v in counts.values()) for i in range(len(ticks))]
        for index, (name, values) in enumerate(counts.items()):
            ax.plot(ticks, values, color=color(name, index), label=name)
        ax.set(title=f"{directory.name} · stop: {result['stop']}", ylabel="living cells")
        ax.legend(loc="upper right", fontsize=8)
        final = {name: values[-1] for name, values in counts.items()}
        minimum = {name: min(values[len(values) // 2:]) for name, values in counts.items()}
        ledger = read(directory / "final.json")["ledger"]
        rows.append({
            "case": directory.name, "ticks": result["ticks"], "stop": result["stop"],
            "final": final, "finalTotal": total[-1],
            "secondHalfMinimum": minimum,
            "deaths": ledger["deaths"], "damageDeaths": ledger["damageDeaths"],
            "groups": {manifest["specification"]["variants"][str(g["genome"])]: {
                "living": g["living"], "initial": g["initialCells"],
                "divisionsPerInitialCell": g["divisionsPerInitialCell"],
                "meanDamagePercent": g["meanDamagePercent"],
                "toxin": g["flows"].get("toxin", 0), "damage": g["flows"].get("damage", 0),
            } for g in result["groups"]},
        })
    axes.flat[-1].set(xlabel="tick")
    figure.tight_layout()
    figure.savefig(root / "rps-trajectories.png", dpi=140)
    plt.close(figure)
    (root / "rps-summary.json").write_text(json.dumps({"schemaVersion": 1, "rows": rows}, indent=2))
    print("case | ticks | stop | final living by strategy | second-half minimum | divisions/founder | deaths (toxin)")
    for r in rows:
        divisions = {k: round(v["divisionsPerInitialCell"], 2) for k, v in r["groups"].items()}
        print(f'{r["case"]} | {r["ticks"]} | {r["stop"]} | {r["final"]} | {r["secondHalfMinimum"]} | '
              f'{divisions} | {r["deaths"]} ({r["damageDeaths"]})')


if __name__ == "__main__":
    report(Path(sys.argv[1]))
