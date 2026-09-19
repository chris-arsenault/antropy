"""Read retained observations/checkpoints; quantify geography without advancing ticks."""
import argparse
from collections import Counter, deque
import json
import subprocess
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def distances(a, b, size):
    delta = np.abs(np.asarray(a)[:, None, :] - np.asarray(b)[None, :, :])
    delta = np.minimum(delta, size - delta)
    return np.sqrt(np.square(delta).sum(axis=2))


def contrast(values):
    values = np.asarray(values)
    mean = values.mean()
    return {
        "mean": float(mean),
        "cv": float(values.std() / mean) if mean else 0.,
        "p10": float(np.quantile(values, .1)),
        "p50": float(np.median(values)),
        "p90": float(np.quantile(values, .9)),
        "effectiveAreaFraction": float(values.sum() ** 2 / (len(values) * np.square(values).sum()))
        if np.any(values) else 0.,
    }


def chemical_difference(rows):
    """Mass-weighted total variation from the global normalized chemical mixture."""
    rows = np.asarray(rows)
    mass = rows.sum(axis=1)
    if mass.sum() == 0:
        return 0.
    local = np.divide(rows, mass[:, None], out=np.zeros_like(rows), where=mass[:, None] > 0)
    global_mix = rows.sum(axis=0) / mass.sum()
    return float((.5 * np.abs(local - global_mix).sum(axis=1) * mass).sum() / mass.sum())


def positions(sources):
    return np.array([[s["habitat"]["x"], s["habitat"]["y"]] for s in sources])


def connectivity(snapshot, threshold):
    """Periodic four-neighbor chemical-0 coverage; no claim of organism viability."""
    nx, ny = snapshot["nx"], snapshot["ny"]
    mask = np.asarray(snapshot["first"]) >= threshold
    labels = np.zeros(len(mask), dtype=int)
    sizes = []
    for start in np.flatnonzero(mask):
        if labels[start]:
            continue
        label = len(sizes) + 1
        labels[start] = label
        queue = deque([start])
        count = 0
        while queue:
            n = queue.popleft()
            count += 1
            x, y = n % nx, n // nx
            for other in [y * nx + (x + 1) % nx, y * nx + (x - 1) % nx,
                          ((y + 1) % ny) * nx + x, ((y - 1) % ny) * nx + x]:
                if mask[other] and not labels[other]:
                    labels[other] = label
                    queue.append(other)
        sizes.append(count)
    largest = int(np.argmax(sizes)) + 1 if sizes else -1
    source_nodes = (positions(snapshot["sources"]) / snapshot["spacing"]).astype(int)
    source_labels = labels[source_nodes[:, 1] * nx + source_nodes[:, 0]]
    return {"components": len(sizes), "largestAreaFraction": max(sizes, default=0) / len(mask),
            "sourcesInLargest": int((source_labels == largest).sum())}


def source_measures(sample, initial, size, path):
    current = positions(sample["environment"]["sources"])
    separation = distances(current, current, size)
    np.fill_diagonal(separation, np.inf)
    displacement = np.diag(distances(current, initial, size))
    return {
        "medianDisplacement": float(np.median(displacement)),
        "maximumDisplacement": float(displacement.max()),
        "medianSampledPath": float(np.median(path)),
        "medianNearestNeighbor": float(np.median(separation.min(axis=1))),
        "pairsWithin20": int((separation < 20).sum() // 2),
    }


def population_measures(sample, centers, colony, size):
    cells = sample["cells"]
    points = np.array([[c["x"], c["y"]] for c in cells]).reshape(-1, 2)
    distances_to_centers = distances(points, centers, size)
    region = distances_to_centers.argmin(axis=1)
    origins = np.array([colony[c["lineage"]] for c in cells])
    counts = np.zeros((len(centers), len(centers)), dtype=int)
    for r, origin in zip(region, origins):
        counts[r, origin] += 1
    mixed = sum(count.sum() for count in counts if np.count_nonzero(count) > 1)
    lineage_regions = {}
    for r, c in zip(region, cells):
        lineage_regions.setdefault(c["lineage"], set()).add(int(r))
    return {
        "count": len(cells), "regions": counts.sum(axis=1).tolist(),
        "regionByFoundingRegion": counts.tolist(),
        "foundingRegionCounts": counts.sum(axis=0).tolist(),
        "cellsInMixedOriginRegions": int(mixed),
        "outsideRadius30": int((distances_to_centers.min(axis=1) > 30).sum()),
        "livingGenomes": len({c["genome"] for c in cells}),
        "livingLineages": len({c["lineage"] for c in cells}),
        "lineagesInMultipleRegions": sum(len(regions) > 1 for regions in lineage_regions.values()),
        "lineageByRegion": [dict(Counter(c["lineage"] for r, c in zip(region, cells) if r == j))
                            for j in range(len(centers))],
    }


def field_measures(snapshot):
    size = np.array([snapshot["width"], snapshot["height"]])
    spacing = snapshot["spacing"]
    xx, yy = np.meshgrid((np.arange(snapshot["nx"]) + .5) * spacing,
                         (np.arange(snapshot["ny"]) + .5) * spacing)
    points = np.column_stack([xx.ravel(), yy.ravel()])
    nearest = distances(points, snapshot["patchCenters"], size).min(axis=1)
    gaps = nearest > 30
    total = np.asarray(snapshot["total"])
    raw = np.asarray(snapshot["raw"])
    first = np.asarray(snapshot["first"])
    drive = np.asarray(snapshot["drive"])
    return {
        "total": contrast(total), "raw": contrast(raw), "first": contrast(first),
        "gapAreaFraction": float(gaps.mean()),
        "sourcesOutsideRadius30": int((distances(positions(snapshot["sources"]),
                                                  snapshot["patchCenters"], size).min(axis=1) > 30).sum()),
        "gapMaterialFraction": float(total[gaps].sum() / total.sum()),
        "gapRawFraction": float(raw[gaps].sum() / raw.sum()),
        "gapByRadius": {str(radius): {
            "areaFraction": float((nearest > radius).mean()),
            "rawFraction": float(raw[nearest > radius].sum() / raw.sum()),
            "materialFraction": float(total[nearest > radius].sum() / total.sum()),
        } for radius in [18, 30, 45]},
        "rawGapToNeighborhoodMean": float(raw[gaps].mean() / raw[~gaps].mean()),
        "firstCoverage": {str(t): float((first >= t).mean()) for t in [.0001, .001, .003, .01]},
        "rawCoverage": {str(t): float((raw >= t).mean()) for t in [.0001, .001, .003, .01]},
        "mixtureTV20": chemical_difference(snapshot["mixtures"]),
        "firstConnectivity": {str(t): connectivity(snapshot, t) for t in [.001, .003, .01]},
        "driveMean": drive.mean(axis=0).tolist(),
        "driveStd": drive.std(axis=0).tolist(),
        "driveQuadrants": [int(((drive[:, 0] * x > 0) & (drive[:, 1] * y > 0)).sum())
                           for x, y in [(-1, -1), (-1, 1), (1, -1), (1, 1)]],
    }


def observed_transfers(samples, centers, size):
    """Same identified cell seen inside two disjoint radius-30 initial neighborhoods."""
    center_distances = distances(centers, centers, size)
    previous = {}
    events = []
    for tick, sample in sorted(samples.items()):
        cells = sample["cells"]
        points = np.array([[c["x"], c["y"]] for c in cells]).reshape(-1, 2)
        d = distances(points, centers, size)
        for c, row in zip(cells, d):
            region = int(row.argmin())
            if row[region] > 30:
                continue
            old = previous.get(c["id"])
            if old and old[0] != region and center_distances[old[0], region] > 60:
                events.append({"cell": c["id"], "from": old[0], "to": region,
                               "lastSeenAtOrigin": old[1], "arrivalSample": tick})
            previous[c["id"]] = (region, tick)
    return events


def draw(snapshots, samples, output):
    chosen = [t for t in [0, 5000, 10000, 25000, 50000] if t in snapshots]
    fig, axes = plt.subplots(2, len(chosen), figsize=(4 * len(chosen), 6), squeeze=False)
    for col, tick in enumerate(chosen):
        s = snapshots[tick]
        shape = (s["ny"], s["nx"])
        extent = [0, s["width"], 0, s["height"]]
        for row, key in enumerate(["raw", "total"]):
            values = np.asarray(s[key]).reshape(shape)
            ax = axes[row, col]
            im = ax.imshow(np.log10(np.maximum(values, 1e-5)), origin="lower", extent=extent,
                           vmin=-5, vmax=0, cmap="magma", interpolation="nearest")
            src = positions(s["sources"])
            ax.scatter(src[:, 0], src[:, 1], s=15, facecolors="none", edgecolors="cyan", lw=.6)
            cells = samples[tick]["cells"]
            ax.scatter([c["x"] for c in cells], [c["y"] for c in cells], s=2, c="white")
            for x, y in s["patchCenters"]:
                for dx in [-s["width"], 0, s["width"]]:
                    for dy in [-s["height"], 0, s["height"]]:
                        ax.add_patch(plt.Circle((x + dx, y + dy), 30, fill=False,
                                               color="lime", alpha=.4, lw=.6))
            ax.set_xlim(0, s["width"])
            ax.set_ylim(0, s["height"])
            ax.set_title(f"{key}, tick {tick:,}")
    fig.colorbar(im, ax=axes.ravel().tolist(), shrink=.7, label="log10 concentration")
    fig.suptitle("Cyan: sources; white: cells; green: fixed initial neighborhoods (radius 30)")
    fig.savefig(output / "geography.png", dpi=140)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("--continuation", type=Path)
    parser.add_argument("--reader", type=Path, required=True)
    args = parser.parse_args()
    output = args.directory / "spatial-analysis"
    output.mkdir(exist_ok=True)
    samples = {}
    snapshots = {}
    segments = [args.directory] + ([args.continuation] if args.continuation else [])
    provenance = []
    for segment_index, segment in enumerate(segments):
        first_tick = None
        for line in (segment / "samples.jsonl").open():
            s = json.loads(line)
            if first_tick is None:
                first_tick = s["tick"]
                if provenance:
                    provenance[-1]["lastRetainedTick"] = first_tick
                samples = {t: row for t, row in samples.items() if t < first_tick}
                snapshots = {t: row for t, row in snapshots.items() if t < first_tick}
            sources = [{"habitat": r["habitat"]} for r in s["environment"]["sources"]]
            samples[s["tick"]] = {"cells": s["cells"], "environment": {"sources": sources},
                                   "summary": s["summary"],
                                   "extracellular": s["environment"]["extracellular"]}
        provenance.append({"directory": str(segment), "firstTick": first_tick,
                           "lastRecordedTick": max(samples), "lastRetainedTick": max(samples)})
        files = [segment / "initial.bin", *segment.glob("checkpoint-*.bin")]
        for file in files:
            prefix = "" if segment_index == 0 else f"segment-{segment_index}-"
            cache = output / f"{prefix}{file.stem}.json"
            if not cache.exists():
                data = subprocess.check_output([str(args.reader.resolve()), str(file)])
                cache.write_bytes(data)
            s = json.loads(cache.read_text())
            snapshots[s["tick"]] = s
    initial = snapshots[0]
    size = np.array([initial["width"], initial["height"]])
    centers = initial["patchCenters"]
    origin_sources = positions(initial["sources"])
    colony = {c["lineage"]: int(distances([[c["x"], c["y"]]], centers, size).argmin())
              for c in samples[0]["cells"]}
    path = np.zeros(len(origin_sources))
    previous = origin_sources
    results = []
    for tick, sample in sorted(samples.items()):
        current = positions(sample["environment"]["sources"])
        path += np.diag(distances(current, previous, size))
        previous = current
        row = {"tick": tick, "sources": source_measures(sample, origin_sources, size, path),
               "population": population_measures(sample, centers, colony, size)}
        if tick in snapshots:
            field_total = np.sum(snapshots[tick]["total"]) * snapshots[tick]["spacing"] ** 2
            mixture_total = np.sum(snapshots[tick]["mixtures"])
            observed_total = sample["extracellular"]["amount"]
            assert np.isclose(field_total, observed_total, rtol=1e-8, atol=1e-8)
            assert np.isclose(mixture_total, observed_total, rtol=1e-8, atol=1e-8)
            row["field"] = field_measures(snapshots[tick])
        results.append(row)
    (output / "metrics.json").write_text(json.dumps(results, indent=2) + "\n")
    (output / "segments.json").write_text(json.dumps(provenance, indent=2) + "\n")
    final = samples[max(samples)]
    totals = np.asarray(final["extracellular"]["species"])
    summary = {"final": final["summary"], "sampledPeakPopulation": max(len(s["cells"]) for s in samples.values()),
               "fieldMaterial": float(totals.sum()),
               "topChemicals": [[int(s), float(totals[s]), float(totals[s] / totals.sum())]
                                for s in np.argsort(totals)[-12:][::-1]],
               "validatedCheckpoints": len(snapshots),
               "foundingRegionExtinctionTicks": {
                   str(region): next((r["tick"] for r in results
                                      if r["population"]["foundingRegionCounts"][region] == 0), None)
                   for region in sorted(set(colony.values()))}}
    transfers = observed_transfers(samples, centers, size)
    summary["observedDisjointCoreTransfers"] = len(transfers)
    summary["uniqueTransferringCells"] = len({e["cell"] for e in transfers})
    summary["lateTransfersAfter40k"] = sum(e["arrivalSample"] > 40000 for e in transfers)
    (output / "transfers.json").write_text(json.dumps(transfers, indent=2) + "\n")
    (output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    draw(snapshots, samples, output)
    print(json.dumps({"samples": len(results), "checkpoints": len(snapshots),
                      "lastTick": results[-1]["tick"], "output": str(output)}))


if __name__ == "__main__":
    main()
