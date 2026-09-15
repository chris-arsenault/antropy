"""Compare static Rust budgets and solve a periodic, unimpeded resource reference by FFT.

Usage: python3 harness/economy_report.py baseline.json revised.json new-output-directory
This advances no organisms or field timesteps. The spatial reference omits consumers and
concentration-dependent impedance; it is not a pointwise bound on the nonlinear world.
"""
import hashlib
import json
from pathlib import Path
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LogNorm
import numpy as np


def equilibrium(report):
    c = report["config"]
    h = c["mesh"]
    nx, ny = int(np.ceil(c["width"] / h)), int(np.ceil(c["height"] / h))
    x, y = np.meshgrid((np.arange(nx) + .5) * h, (np.arange(ny) + .5) * h)
    q = np.zeros((2, ny, nx))
    for site in report["renewal"]["sites"]:
        a = site["habitat"]
        dx = (x - a["x"] + c["width"] / 2) % c["width"] - c["width"] / 2
        dy = (y - a["y"] + c["height"] / 2) % c["height"] - c["height"] / 2
        r = max(a["radius"], h * .25)
        distance = dx * dx + dy * dy
        weights = np.where(distance <= 9 * r * r, np.exp(-distance / (2 * r * r)), 0.)
        weights /= weights.sum()
        for i, share in enumerate([a["share"], 1 - a["share"]]):
            q[i] += weights * site["meanReleaseRate"] * share / (h * h)
    eigenvalues = 4 / (h * h) * (
        np.sin(np.pi * np.fft.fftfreq(ny))[:, None] ** 2
        + np.sin(np.pi * np.fft.fftfreq(nx))[None, :] ** 2
    )
    fields = []
    for i, species in enumerate(c["sourceSpecies"]):
        diffusion = report["chemistry"]["properties"][species]["diffusion"]
        fields.append(np.fft.ifft2(np.fft.fft2(q[i]) / (c["washout"] + diffusion * eigenvalues)).real)
    total = np.sum(fields, axis=0)
    expected = report["renewal"]["meanReleaseRate"] / c["washout"]
    if not np.isclose(total.sum() * h * h, expected, rtol=1e-10):
        raise ValueError("Steady resource solution does not close its material budget")
    return total, {
        "mean": float(total.mean()), "standardDeviation": float(total.std()),
        "percentiles": dict(zip(["10", "50", "90", "99"], np.percentile(total, [10, 50, 90, 99]).tolist())),
        "meanMaterial": float(total.sum() * h * h),
    }


def main():
    if len(sys.argv) != 4:
        raise SystemExit(__doc__)
    paths = [Path(p) for p in sys.argv[1:3]]
    reports = [json.loads(p.read_text()) for p in paths]
    output = Path(sys.argv[3])
    output.mkdir()
    fig, axes = plt.subplots(2, 2, figsize=(12, 8), constrained_layout=True)
    records = []
    for column, (name, report) in enumerate(zip(["Baseline", "Revised"], reports)):
        field, metrics = equilibrium(report)
        c = report["config"]
        image = axes[0, column].imshow(np.maximum(field, 1e-6), origin="lower",
            extent=[0, c["width"], 0, c["height"]], norm=LogNorm(.001, 10), cmap="viridis")
        axes[0, column].set_title(f"{name}: mean resource field, no consumers or impedance")
        axes[0, column].set_xlabel("World x")
        axes[0, column].set_ylabel("World y")
        for share, label in [(1., f"Chemical {c['sourceSpecies'][0]}"),
                             (.5, "Equal mixture"), (0., f"Chemical {c['sourceSpecies'][1]}")]:
            rows = [r for r in report["cases"] if r["bodyScale"] == 2 and r["firstShare"] == share
                    and r["concentration"] <= .3
                    and r["budget"]["closureGrowthMargin"] is not None]
            axes[1, column].plot([r["concentration"] for r in rows],
                [r["budget"]["closureGrowthMargin"] for r in rows], marker="o", label=label)
        axes[1, column].axhline(0, color="black", linewidth=.8)
        axes[1, column].set_xscale("log")
        axes[1, column].set_xlim(.009, .33)
        axes[1, column].set_ylim(-.04, .2)
        axes[1, column].set_xlabel("Local total supplied-chemical concentration")
        axes[1, column].set_ylabel("Parent energy surplus after modeled growth and repair / s")
        axes[1, column].legend()
        records.append({"label": name, "inputSha256": hashlib.sha256(paths[column].read_bytes()).hexdigest(),
                        "spatialReference": metrics, "renewal": {k: v for k, v in report["renewal"].items()
                        if k not in ["sites", "hypotheticalUniformMeanBudget"]}})
    fig.colorbar(image, ax=axes[0, :], label="Total chemical concentration")
    fig.savefig(output / "economy.png", dpi=160)
    plt.close(fig)
    manifest = {"method": "Periodic discrete diffusion/washout resolvent solved by FFT; no timesteps",
                "limits": "No consumers or impedance; steady mean supply, not instantaneous pulses or population viability",
                "reports": records}
    (output / "comparison.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
