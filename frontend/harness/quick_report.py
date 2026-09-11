"""Render local quick-run evidence; no simulation execution or hosted publication.

From frontend: python3 harness/quick_report.py harness/artifacts/quick-food-2026-09-11
"""
import json
import hashlib
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def read(path):
    return json.loads(path.read_text())


def report(root):
    cases = sorted(root.glob("*/*/result.json"))
    if not cases:
        raise ValueError("No quick experiment results under stage/case directories")
    nrows = (len(cases) + 3) // 4
    figure, axes = plt.subplots(nrows, 4, figsize=(16, 4 * nrows), squeeze=False)
    rows = []
    for ax, path in zip(axes.flat, cases):
        plot_case(ax, path.parent)
    for ax in list(axes.flat)[len(cases):]:
        ax.set_visible(False)
    for path in cases:
        result, manifest = read(path), read(path.parent / "manifest.json")
        if result["sourceDigestAfter"] != manifest["sourceDigest"]:
            raise ValueError(f"Source changed: {path}")
        for group in result["groups"]:
            if group["initialCells"]:
                rows.append({"case": str(path.parent.relative_to(root)),
                             "ticks": result["ticks"], "stop": result["stop"],
                             "wallMs": result["wallMs"], **group})
    figure.suptitle("Initial food A and founder paths through tick 300 or division/death\n"
                   "Orange: stronger propulsion; blue: weaker. Dotted circle: arrival region.")
    figure.tight_layout()
    figure.savefig(root / "trajectories.png", dpi=150)
    plt.close(figure)
    (root / "comparison.json").write_text(json.dumps({
        "schemaVersion": 1,
        "reportSourceDigest": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "rows": rows,
    }, indent=2))
    print("case | genome | food A captured % | motors / absorbed energy % | divisions / founder | living")
    for r in rows:
        print(f'{r["case"]} | {r["genome"]} | {r["offeredFoodACapturedPercent"]:.2f} | '
              f'{r["motorPercentAbsorbedEnergy"]:.2f} | {r["divisionsPerInitialCell"]:.2f} | {r["living"]}')


def plot_case(ax, directory):
    manifest = read(directory / "manifest.json")
    initial = read(directory / "initial.json")
    frames = read(directory / "traces.json")
    # Use checkpoint field encoding, not a re-created or normalized hypothetical food patch.
    width, height = manifest["config"]["width"], manifest["config"]["height"]
    food = np.asarray(initial["nutrient"]).reshape(height, width)
    ax.imshow(food, origin="lower", extent=(-0.5, width-0.5, -0.5, height-0.5), cmap="Greys", alpha=0.65)
    founders = {c["id"]: c["genome"] for c in frames[0]["cells"]}
    for cell_id, genome in founders.items():
        points = [(c["x"], c["y"]) for f in frames if f["tick"] <= 300
                  for c in f["cells"] if c["id"] == cell_id]
        color = "#cf6200" if genome == 1 else "#0079b5"
        x, y = zip(*points)
        ax.plot(x, y, color=color, linewidth=1)
        ax.scatter(x[0], y[0], color=color, s=10)
    target = manifest["target"]
    ax.add_patch(plt.Circle((target["x"], target["y"]), target["radius"],
                           fill=False, linestyle=":", color="black"))
    ax.set(xlim=(-0.5, width-0.5), ylim=(-0.5, height-0.5), aspect="equal",
           title=f"{directory.parent.name}/{directory.name}")


if __name__ == "__main__":
    report(Path(sys.argv[1]))
