"""Summarize producer/resistant/sensitive contests from saved traces; runs no simulation.

From frontend: python3 harness/rps_report.py harness/artifacts/rps-<date>
"""
import json
import argparse
import hashlib
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


def frequencies(groups):
    """Compare ancestry-group shares; more descendants alone is not an invasion advantage."""
    initial_total = sum(g["initialCells"] for g in groups)
    final_total = sum(g["living"] for g in groups)
    rows = []
    for group in groups:
        initial = 100 * group["initialCells"] / initial_total if initial_total else None
        final = 100 * group["living"] / final_total if final_total else None
        rows.append({
            "genome": group["genome"], "initial": group["initialCells"],
            "living": group["living"], "initialTotal": initial_total, "finalTotal": final_total,
            "initialSharePercent": initial, "finalSharePercent": final,
            "changePercentagePoints": final - initial if final is not None and initial is not None else None,
        })
    return rows


def audit(roots, output):
    """Export exact endpoint denominators and provenance without loading traces or advancing worlds."""
    paths = sorted({p for root in roots for p in root.rglob("result.json")})
    rows = []
    for path in paths:
        result = read(path)
        if "groups" not in result:
            continue
        manifest_path = path.with_name("manifest.json")
        manifest = read(manifest_path)
        spec = manifest["specification"]
        rows.append({
            "sourceResult": str(path),
            "resultSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "manifestSha256": hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
            "sourceDigestBefore": manifest.get("sourceDigest"),
            "sourceDigestAfter": result.get("sourceDigestAfter"),
            "sourceChanged": manifest.get("sourceDigest") != result.get("sourceDigestAfter"),
            "case": path.parent.name, "ticks": result["ticks"], "stop": result["stop"],
            "completed": result["completed"], "seed": manifest.get("seed"),
            "rare": spec.get("rare"), "variants": spec["variants"],
            "settings": spec.get("settings"),
            "groups": frequencies(result["groups"]),
        })
    if not rows:
        raise ValueError("No saved contest results found")
    payload = {
        "schemaVersion": 1,
        "method": "100 * living descendants / all living cells, compared with the initial share",
        "limits": "Endpoint ancestry shares only. No coexistence verdict, generation-duration test, "
                  "resident equilibration, statistical significance or causal attribution. "
                  "With gene transfer, ancestry groups need not retain their initial traits.",
        "analysisSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "rows": rows,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x") as stream:
        json.dump(payload, stream, indent=2)
        stream.write("\n")
    print(f"Saved {len(rows)} contest endpoints to {output}; no simulation advanced")


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
            print(f"warning: source changed during {directory}", file=sys.stderr)
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
            "frequencies": frequencies(result["groups"]),
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
    (root / "rps-summary.json").write_text(json.dumps({"schemaVersion": 2, "rows": rows}, indent=2))
    print("case | ticks | stop | final living by strategy | second-half minimum | divisions/founder | deaths (toxin)")
    for r in rows:
        divisions = {k: round(v["divisionsPerInitialCell"], 2) for k, v in r["groups"].items()}
        print(f'{r["case"]} | {r["ticks"]} | {r["stop"]} | {r["final"]} | {r["secondHalfMinimum"]} | '
              f'{divisions} | {r["deaths"]} ({r["damageDeaths"]})')
        print("  initial/final shares and percentage-point changes:", r["frequencies"])
    print("Counts and endpoint share changes do not establish stable coexistence.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("roots", nargs="+", type=Path)
    parser.add_argument("--audit", type=Path, metavar="OUTPUT_JSON",
                        help="Recursively export endpoint shares to a new file; skip plots and traces")
    args = parser.parse_args()
    if args.audit:
        audit(args.roots, args.audit)
    elif len(args.roots) == 1:
        report(args.roots[0])
    else:
        parser.error("Multiple roots require --audit")
