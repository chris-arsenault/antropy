"""Cluster living phenotypes from saved evolution samples; runs no simulation.

From frontend: python3 harness/evolve_report.py harness/artifacts/evolve-<date> [k]

Clusters use inherited construction traits only (A share of processing, motor, core, defense,
toxin, matrix and light-harvesting machinery), standardized, with k-means from fixed seeds. Cluster labels are
descriptions of the living distribution, never a fitness score or a selection input.
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

TRAITS = ["foodA", "motor", "core", "defense", "weapon", "builder", "photo"]


def read(path):
    return json.loads(path.read_text())


def matrix(sample):
    # Samples recorded before the element cycle carry no photo trait; treat it as zero.
    return np.array([[c.get(t, 0.0) for t in TRAITS] for c in sample["cells"]], dtype=float)


def kmeans(x, k, seeds=8, iterations=50):
    best = None
    for seed in range(seeds):
        rng = np.random.default_rng(seed)
        centers = x[rng.choice(len(x), k, replace=False)]
        for _ in range(iterations):
            labels = np.argmin(((x[:, None, :] - centers[None, :, :]) ** 2).sum(-1), axis=1)
            new = np.array([x[labels == j].mean(0) if (labels == j).any() else centers[j] for j in range(k)])
            if np.allclose(new, centers):
                break
            centers = new
        inertia = ((x - centers[labels]) ** 2).sum()
        if best is None or inertia < best[0]:
            best = (inertia, labels, centers)
    return best[1], best[2]


def standardize(x, mean, std):
    return (x - mean) / np.where(std > 1e-9, std, 1)


def describe_run(directory, k):
    manifest = read(directory / "manifest.json")
    samples = read(directory / "samples.json")
    width = manifest["config"]["width"]
    final = samples[-1]
    x = matrix(final)
    mean, std = x.mean(0), x.std(0)
    labels, centers = kmeans(standardize(x, mean, std), k)
    raw_centers = centers * np.where(std > 1e-9, std, 1) + mean
    order = np.argsort(raw_centers[:, 0])  # by A share ascending
    clusters = []
    for rank, j in enumerate(order):
        members = [c for c, l in zip(final["cells"], labels) if l == j]
        left = sum(1 for c in members if c["x"] < width / 2)
        clusters.append({
            "cluster": rank, "size": len(members), "leftBand": left, "rightBand": len(members) - left,
            "center": {t: round(float(v), 2) for t, v in zip(TRAITS, raw_centers[j])},
            "spread": {t: round(float(np.std([c.get(t, 0.0) for c in members])), 2) for t in TRAITS} if members else {},
        })
    # Assign every sample's cells to the final centers to draw cluster frequencies over time.
    ticks, freq, share_hist = [], [], []
    bins = np.linspace(0, 100, 21)
    for s in samples:
        if not s["cells"]:
            continue
        xs = standardize(matrix(s), mean, std)
        l = np.argmin(((xs[:, None, :] - centers[None, :, :]) ** 2).sum(-1), axis=1)
        ticks.append(s["tick"])
        freq.append([int((l == j).sum()) for j in order])
        share_hist.append(np.histogram([c["foodA"] for c in s["cells"]], bins=bins)[0])
    generation = max(c["generation"] for c in final["cells"]) if final["cells"] else 0
    return {
        "label": manifest["label"], "status": manifest["status"], "ticks": final["tick"],
        "population": final["population"], "maxGeneration": generation,
        "clusters": clusters, "ticks_series": ticks, "frequencies": freq,
        "foodA_bimodality": bimodality([c["foodA"] for c in final["cells"]]),
    }, np.array(share_hist).T, ticks


def bimodality(values):
    v = np.asarray(values, dtype=float)
    if len(v) < 4:
        return None
    m = v.mean(); s = v.std()
    if s < 1e-9:
        return 0.0
    g = ((v - m) ** 3).mean() / s ** 3
    kurt = ((v - m) ** 4).mean() / s ** 4 - 3
    n = len(v)
    return round(float((g ** 2 + 1) / (kurt + 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)))), 3)


def report(root, k):
    runs = sorted(p.parent for p in root.glob("*/samples.json"))
    if not runs:
        raise ValueError("No evolution samples under run directories")
    figure, axes = plt.subplots(len(runs), 2, figsize=(14, 3 * len(runs)), squeeze=False)
    rows = []
    for (ax_hist, ax_freq), directory in zip(axes, runs):
        row, hist, ticks = describe_run(directory, k)
        rows.append(row)
        ax_hist.imshow(hist, aspect="auto", origin="lower", cmap="magma",
                       extent=(ticks[0], ticks[-1], 0, 100))
        ax_hist.set(title=f"{row['label']} · A share of processing, living cells", ylabel="% A")
        for j, series in enumerate(np.array(row["frequencies"]).T):
            ax_freq.plot(row["ticks_series"], series, label=f"cluster {j} (A {row['clusters'][j]['center']['foodA']}%)")
        ax_freq.set(title="cluster frequencies (final centres)", ylabel="cells")
        ax_freq.legend(fontsize=7)
    axes[-1][0].set(xlabel="tick"); axes[-1][1].set(xlabel="tick")
    figure.tight_layout()
    figure.savefig(root / "evolve-clusters.png", dpi=130)
    plt.close(figure)
    (root / "evolve-summary.json").write_text(json.dumps({"schemaVersion": 1, "k": k, "runs": [
        {key: value for key, value in r.items() if key not in ("ticks_series", "frequencies")} for r in rows
    ]}, indent=2))
    for r in rows:
        print(f"{r['label']} | {r['status']} | tick {r['ticks']} | N {r['population']} | gen {r['maxGeneration']} | bimodality(A share) {r['foodA_bimodality']}")
        for c in r["clusters"]:
            print(f"   cluster {c['cluster']}: n={c['size']} L/R {c['leftBand']}/{c['rightBand']} centre {c['center']}")


if __name__ == "__main__":
    report(Path(sys.argv[1]), int(sys.argv[2]) if len(sys.argv) > 2 else 2)
