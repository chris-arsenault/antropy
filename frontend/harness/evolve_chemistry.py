"""Stream current evolution observations; retain trait vectors, never whole genome arrays."""
import hashlib
import json
from pathlib import Path
import numpy as np

TRAITS = ["membraneX", "membraneY", "importX", "importY", "motor", "core", "receptors", "importers", "enzymes"]


def records(path, interruptions=None):
    with Path(path).open() as stream:
        for number, line in enumerate(stream, 1):
            if line.strip():
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    # Only an unterminated final write is recoverable. Interior corruption fails.
                    if interruptions is None or line.endswith("\n") or stream.read():
                        raise
                    interruptions.add(f"{Path(path).name}:{number}: incomplete final record omitted")


def inherited_vectors(directory):
    values = {}
    for row in records(directory / "genomes.jsonl"):
        facts = row["facts"]
        body, chemistry = facts["blueprint"], facts["expressed"]["chemistry"]
        imports = [(body[7 + i], t) for i, t in enumerate(chemistry["transporters"]) if not t["export"]]
        total = sum(q for q, _ in imports)
        center = [sum(q * t[axis] for q, t in imports) / total if total else 0 for axis in ("x", "y")]
        values[row["genotype"]["id"]] = [chemistry["membrane"]["x"], chemistry["membrane"]["y"],
            *center, body[1] / body[0], body[0], sum(body[3:7]) / body[0], total / body[0], sum(body[11:15]) / body[0]]
    return values


def describe(directory, k, cluster):
    manifest = json.loads((directory / "manifest.json").read_text())
    if manifest.get("checkpointVersion") not in (10, 11):
        raise ValueError(f"Unsupported physical checkpoint schema: {directory}")
    values = inherited_vectors(directory)
    interruptions = set()
    final = None
    for final in records(directory / "samples.jsonl", interruptions):
        pass
    captured = final is not None
    if not captured:
        final = {"tick": None, "cells": []}
    x = np.asarray([values[c["genome"]] for c in final["cells"]], dtype=float)
    k = min(k, len(np.unique(x, axis=0))) if len(x) else 0
    mean, scale, centers = np.zeros(9), np.ones(9), np.empty((0, 9))
    if k:
        mean, scale = x.mean(0), x.std(0)
        scale = np.where(scale > 1e-9, scale, 1)
        _, centers = cluster((x - mean) / scale, k)
        centers = centers[np.argsort((centers * scale + mean)[:, 0])]
    points, frequencies, histograms = [], [], []
    for frame in records(directory / "samples.jsonl", interruptions):
        vectors = np.asarray([values[c["genome"]] for c in frame["cells"]], dtype=float)
        n = len(vectors)
        labels = np.empty(0, dtype=int)
        if n and k:
            labels = np.argmin(((((vectors - mean) / scale)[:, None, :] - centers[None, :, :]) ** 2).sum(-1), axis=1)
        points.append({"tick": frame["tick"], "population": n})
        frequencies.append([100 * int((labels == j).sum()) / n if n else 0 for j in range(k)])
        histograms.append(np.histogram(vectors[:, 0], bins=np.arange(17) - 0.5)[0] / n * 100 if n else np.zeros(16))
    summary = {"directory": str(directory), "label": manifest["label"], "status": manifest["status"],
        "tick": final["tick"], "population": len(final["cells"]), "groups": k,
        "checkpointVersion": manifest["checkpointVersion"],
        "coverage": "captured observations" if captured else "no captured observations",
        "interruptions": sorted(interruptions),
        "centers": [dict(zip(TRAITS, row)) for row in centers * scale + mean],
        "populationDenominator": "Living cells in each captured sample",
        "sourceDigest": manifest["sourceDigest"], "binaryDigest": manifest["binaryDigest"],
        "manifestSha256": hashlib.sha256((directory / "manifest.json").read_bytes()).hexdigest(),
        "series": points, "sharesPercent": frequencies}
    return summary, np.asarray(histograms).T


def report(root, k, cluster):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    if k < 1:
        raise ValueError("Descriptive cluster count must be positive")
    directories = sorted(p.parent for p in root.glob("*/manifest.json"))
    if len({json.loads((p / "manifest.json").read_text())["checkpointVersion"] for p in directories}) != 1:
        raise ValueError("Separate physical checkpoint schemas into different report roots")
    figure, axes = plt.subplots(len(directories), 2, figsize=(14, 3.5 * len(directories)), squeeze=False)
    rows = []
    for directory, (left, right) in zip(directories, axes):
        row, histogram = describe(directory, k, cluster)
        rows.append(row)
        ticks = [p["tick"] for p in row["series"]]
        # Irregular sample times stay irregular rather than being stretched to equal intervals.
        if ticks:
            left.pcolormesh(ticks, np.arange(16), histogram, shading="nearest", vmin=0, vmax=100, cmap="magma")
        left.set(title=row["label"], ylabel="Membrane X · share of living cells", xlabel="Tick")
        for j in range(row["groups"]):
            right.plot(ticks, [p[j] for p in row["sharesPercent"]], label=f"descriptive group {j}")
        if row["groups"]:
            right.legend(fontsize=7)
        else:
            right.set_title("Extinct at last observation" if ticks else "No captured observations")
        right.set(xlabel="Tick", ylabel="Living share (%)", ylim=(0, 100))
    figure.tight_layout()
    figure.savefig(root / "evolve-clusters.png", dpi=130)
    plt.close(figure)
    result = {"schemaVersion": 3, "requestedGroups": k, "traits": TRAITS,
        "interpretation": "Endpoint clusters describe inherited traits; they neither identify stable species nor prove adaptation. Zero import capacity has no effective import target; its coordinates are represented as zero.",
        "runs": rows}
    (root / "evolve-summary.json").write_text(json.dumps(result, indent=2, allow_nan=False))
    print(json.dumps({"runs": len(rows), "output": str(root / "evolve-summary.json")}))
