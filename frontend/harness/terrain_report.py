"""Local terrain maps and descriptive diagnostics; consumes the native preview, no ticks."""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

source, destination = map(Path, sys.argv[1:3])
destination.mkdir(exist_ok=False)
record = json.loads(source.read_text())[0]
g = record["shade"]["geography"]
shape = (record["ny"], record["nx"])
h = np.asarray(g["height"]).reshape(shape)
q = np.asarray(g["conductance"]).reshape(shape)
t = np.asarray(record["shade"]["transmission"]).reshape(shape)
season = np.asarray(g["seasons"]).reshape((*shape, 2))
amplitude = np.linalg.norm(season, axis=2)
phase = (np.arctan2(season[:, :, 1], season[:, :, 0]) + g["phase"]) % (2*np.pi)
supply = 1 + season[:, :, 0]*np.cos(g["phase"]) - season[:, :, 1]*np.sin(g["phase"])
dy, dx = [(np.roll(h, -1, axis)-np.roll(h, 1, axis))/(2*g["spacing"]) for axis in [0, 1]]
slope = np.hypot(dx, dy)
extent = (0, record["config"]["width"], 0, record["config"]["height"])
fig, axes = plt.subplots(2, 3, figsize=(15, 9), constrained_layout=True)
for ax, data, label, cmap in zip(axes.flat, [h, q, t, slope, amplitude, supply],
                               ["Elevation and reservoirs", "Conductance", "Overhead transmission",
                                "Grade", "Seasonal amplitude", "Supply multiplier at boot"],
                               ["terrain", "YlGnBu", "gray", "magma", "viridis", "BrBG"]):
    picture = ax.imshow(data, origin="lower", extent=extent, cmap=cmap, interpolation="nearest")
    ax.set_title(label)
    fig.colorbar(picture, ax=ax, shrink=0.8)
sources = np.asarray([[s["x"], s["y"]] for s in record["sources"]])
axes[0, 0].scatter(*sources.T, s=6, c="black", alpha=0.7)
fig.savefig(destination / "terrain.png", dpi=150)
plt.close(fig)

fig, axes = plt.subplots(1, 3, figsize=(16, 5), constrained_layout=True)
axes[0].imshow(phase, origin="lower", extent=extent, cmap="twilight", vmin=0, vmax=2*np.pi)
axes[0].set_title("Season phase (weak amplitudes remain weak)")
axes[1].imshow(h[:90, :120], origin="lower", cmap="terrain", interpolation="nearest")
axes[1].set_title("Elevation detail, first 240 by 180 world units")
rho = np.asarray(record["resourceDensity"]).reshape(shape)
axes[2].imshow(np.log(rho), origin="lower", extent=extent, cmap="magma")
axes[2].scatter(*sources.T, s=6, c="cyan")
axes[2].set_title("Log placement intensity and actual sites")
fig.savefig(destination / "detail-phase.png", dpi=150)
plt.close(fig)

distance = np.abs(sources[:, None, :] - sources[None, :, :])
distance = np.minimum(distance, np.asarray(extent[1::2]) - distance)
distance = np.linalg.norm(distance, axis=2)
np.fill_diagonal(distance, np.inf)
quantiles = lambda a: np.quantile(a, [0, .1, .5, .9, 1]).tolist()
radii = np.asarray([s["radius"] for s in record["sources"]])
overlap = distance < radii[:, None] + radii[None, :]
centered = h-h.mean()
variance = np.mean(centered**2)
autocorrelation = {str(axis): [float(np.mean(centered*np.roll(centered, lag, axis))/variance)
                              for lag in [1, 4, 8, 16, 32, 64]] for axis in [0, 1]}
differences = {str(lag): [float(np.mean((h-np.roll(h, lag, axis))**2))
                         for axis in [0, 1]] for lag in [1, 2, 4, 8, 16, 32]}
counts, _, _ = np.histogram2d(*sources.T, bins=[12, 9], range=[[0, extent[1]], [0, extent[3]]])
mass = rho.reshape(9, shape[0]//9, 12, shape[1]//12).sum(axis=(1, 3)).T
probability = mass/mass.sum()
expected = len(sources)*probability
standardized = (counts-expected)/np.sqrt(expected*(1-probability))
quiet_fraction = np.arccos(np.minimum(1, .5/np.maximum(amplitude, 1e-30)))/np.pi
coordinate = sources/g["spacing"]-.5
indices = np.floor(coordinate).astype(int)
fractions = coordinate-indices
local_seasons = np.zeros_like(sources)
for iy in range(2):
    for ix in range(2):
        weights = (fractions[:, 0] if ix else 1-fractions[:, 0]) * (fractions[:, 1] if iy else 1-fractions[:, 1])
        local_seasons += weights[:, None]*season[(indices[:, 1]+iy)%shape[0], (indices[:, 0]+ix)%shape[1]]
local_amplitude = np.linalg.norm(local_seasons, axis=1)
neighbor = distance.argmin(axis=1)
# At source i's trough, the neighboring multiplier is 1 - dot(s_i,s_j)/|s_i|.
neighbor_advantage = local_amplitude - np.sum(local_seasons*local_seasons[neighbor], axis=1)/np.maximum(local_amplitude, 1e-30)
report = {"generationMs": record["generationMs"], "quantiles": {
    "grade": quantiles(slope), "conductance": quantiles(q), "transmission": quantiles(t),
    "seasonAmplitude": quantiles(amplitude), "supplyAtBoot": quantiles(supply),
    "sourceNearestNeighbor": quantiles(distance.min(axis=1))},
    "heightConductanceShadeAmplitudeCorrelation": np.corrcoef([a.ravel() for a in [h, q, t, amplitude]]).tolist(),
    "heightDirectionalGradientVarianceRatio": float(np.var(dx)/np.var(dy)),
    "heightAutocorrelationAtMeshLags1_4_8_16_32_64": autocorrelation,
    "heightSquaredDifferenceByMeshLag": differences,
    "initialOverlapPairs": int(overlap.sum()/2),
    "sourcesWithInitialOverlap": int(overlap.any(axis=1).sum()),
    "sourceCountsIn60UnitSquares": counts.astype(int).tolist(),
    "placementBinomialResidualMax": float(np.max(np.abs(standardized))),
    "placementSquaresOutsideTwoSigma": int((np.abs(standardized)>2).sum()),
    "fractionOfMapWithSupplyBelowHalfDuringCycle": float((amplitude>.5).mean()),
    "quietSecondsBelowHalfQuantiles": quantiles(quiet_fraction*record["config"]["terrain"]["seasonPeriod"]),
    "nearestNeighborSupplyAdvantageAtLocalTroughQuantiles": quantiles(neighbor_advantage),
    "sourcesWithNearestNeighborMultiplierAtLeastPointOneBetterAtTrough": int((neighbor_advantage>.1).sum()),
    "sampling": g.get("sampling"),
    "notes": "One registered seed; correlations and gaps are descriptive, not ecological acceptance."}
(destination / "summary.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report))
