"""Cluster living phenotypes from saved evolution samples; runs no simulation.

From frontend: python3 harness/evolve_report.py harness/artifacts/evolve-<date> [k]

Current schema-v3 streams use kernel-derived chemical targets and construction traits.
Historical schema-v1/v2 readers remain read-only. Roots cannot mix physical formats.
Cluster labels describe the living distribution, never fitness or stable species.
"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

TRAITS = ["foodA", "motor", "core", "defense", "weapon", "builder", "photo", "tint"]


def read(path):
    return json.loads(path.read_text())


CHEMICAL_TRAITS = ["membraneX", "membraneY", "importX", "importY", "motor", "core", "receptors", "importers", "enzymes"]


def matrix(sample, traits=TRAITS):
    # Samples recorded before the element cycle carry no photo trait; treat it as zero.
    if traits == CHEMICAL_TRAITS:
        return np.array([[c[t] for t in traits] for c in sample["cells"]], dtype=float)
    return np.array([[c.get(t, 0.0) for t in traits] for c in sample["cells"]], dtype=float)


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
    current = manifest.get("schemaVersion", 1) == 2
    traits = CHEMICAL_TRAITS if current else TRAITS
    hist_trait, ceiling = ("membraneX", 15) if current else ("foodA", 100)
    if not final["cells"]:
        return {"label": manifest["label"], "status": manifest["status"], "ticks": final["tick"],
                "population": 0, "maxGeneration": 0, "clusters": [], "ticks_series": [],
                "frequencies": [], "bimodality": None, "histTrait": hist_trait, "ceiling": ceiling}, None, []
    k = min(k, len(final["cells"]))
    if k < 1:
        raise ValueError("Cluster count must be positive")
    x = matrix(final, traits)
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
            "center": {t: round(float(v), 2) for t, v in zip(traits, raw_centers[j])},
            "spread": {t: round(float(np.std([c.get(t, 0.0) for c in members])), 2) for t in traits} if members else {},
        })
    # Assign every sample's cells to the final centers to draw cluster frequencies over time.
    ticks, freq, share_hist = [], [], []
    bins = np.linspace(0, ceiling, 21)
    for s in samples:
        if not s["cells"]:
            continue
        xs = standardize(matrix(s, traits), mean, std)
        l = np.argmin(((xs[:, None, :] - centers[None, :, :]) ** 2).sum(-1), axis=1)
        ticks.append(s["tick"])
        freq.append([int((l == j).sum()) for j in order])
        share_hist.append(np.histogram([c[hist_trait] for c in s["cells"]], bins=bins)[0])
    generation = max(c["generation"] for c in final["cells"]) if final["cells"] else 0
    return {
        "label": manifest["label"], "status": manifest["status"], "ticks": final["tick"],
        "population": final["population"], "maxGeneration": generation,
        "clusters": clusters, "ticks_series": ticks, "frequencies": freq,
        "bimodality": bimodality([c[hist_trait] for c in final["cells"]]),
        "histTrait": hist_trait, "ceiling": ceiling,
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
    manifests = list(root.glob("*/manifest.json"))
    versions = {read(p).get("schemaVersion", 1) for p in manifests}
    if 3 in versions:
        if versions != {3}:
            raise ValueError("Separate historical and current chemistry roots")
        from evolve_chemistry import report as current_report
        return current_report(root, k, kmeans)
    if versions - {1, 2}:
        raise ValueError("Unsupported evolution observation schema")
    runs = sorted(p.parent for p in root.glob("*/samples.json"))
    if not runs:
        raise ValueError("No evolution samples under run directories")
    versions = {read(p / "manifest.json").get("schemaVersion", 1) for p in runs}
    if len(versions) != 1:
        raise ValueError("Separate historical and current chemistry roots")
    figure, axes = plt.subplots(len(runs), 2, figsize=(14, 3 * len(runs)), squeeze=False)
    rows = []
    for (ax_hist, ax_freq), directory in zip(axes, runs):
        row, hist, ticks = describe_run(directory, k)
        rows.append(row)
        if hist is None:
            ax_hist.set_title(f"{row['label']}: extinct; no final cluster centers")
            ax_freq.set_visible(False)
            continue
        ax_hist.imshow(hist, aspect="auto", origin="lower", cmap="magma",
                       extent=(ticks[0], max(ticks[-1], ticks[0] + 1), 0, row["ceiling"]))
        ax_hist.set(title=f"{row['label']} · {row['histTrait']}, living cells", ylabel=row["histTrait"])
        for j, series in enumerate(np.array(row["frequencies"]).T):
            ax_freq.plot(row["ticks_series"], series, label=f"cluster {j}")
        ax_freq.set(title="cluster frequencies (final centres)", ylabel="cells")
        ax_freq.legend(fontsize=7)
    axes[-1][0].set(xlabel="tick"); axes[-1][1].set(xlabel="tick")
    figure.tight_layout()
    figure.savefig(root / "evolve-clusters.png", dpi=130)
    plt.close(figure)
    (root / "evolve-summary.json").write_text(json.dumps({"schemaVersion": next(iter(versions)), "k": k, "interpretation": "Descriptive clusters, not evidence of adaptation or stable species", "runs": [
        {key: value for key, value in r.items() if key not in ("ticks_series", "frequencies")} for r in rows
    ]}, indent=2))
    for r in rows:
        print(f"{r['label']} | {r['status']} | tick {r['ticks']} | N {r['population']} | gen {r['maxGeneration']} | bimodality({r['histTrait']}) {r['bimodality']}")
        for c in r["clusters"]:
            print(f"   cluster {c['cluster']}: n={c['size']} L/R {c['leftBand']}/{c['rightBand']} centre {c['center']}")


if __name__ == "__main__":
    report(Path(sys.argv[1]), int(sys.argv[2]) if len(sys.argv) > 2 else 2)
