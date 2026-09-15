"""Plot exported shared-law samples and physical-space tables; no simulation or seed search."""
import json
import sys
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LogNorm
import numpy as np


def save(figure, root, name):
    figure.tight_layout()
    figure.savefig(root / f"{name}.png", dpi=160)
    figure.savefig(root / f"{name}.pdf")
    plt.close(figure)


def plot(root):
    data = json.loads((root / "definition.json").read_text())
    definition = data["definition"]
    table = definition["properties"]
    names = ["potential", "diffusion", "impedance", "stress"]
    arrays = {key: np.array([p[key] for p in table]).reshape(16, 16).T for key in names}
    figure, axes = plt.subplots(2, 2, figsize=(10, 9))
    for axis, key in zip(axes.flat, names):
        lo, hi = definition["ranges"][key]
        opts = {"norm": LogNorm(lo, hi)} if key == "diffusion" else {"vmin": lo, "vmax": hi}
        im = axis.imshow(arrays[key], origin="lower", extent=(-.5, 15.5, -.5, 15.5), **opts)
        axis.set(title=key, xlabel="Chemical X", ylabel="Chemical Y")
        figure.colorbar(im, ax=axis, shrink=.8)
    save(figure, root, "physical-properties")
    figure, axes = plt.subplots(1, 3, figsize=(13, 4))
    for axis, (x, y) in zip(axes, [("potential", "stress"), ("impedance", "diffusion"), ("potential", "impedance")]):
        axis.scatter(arrays[x].flat, arrays[y].flat, s=8)
        axis.set(xlabel=x, ylabel=y)
        if y == "diffusion":
            axis.set_yscale("log")
        axis.grid(alpha=.2)
    save(figure, root, "joint-distributions")
    figure, axes = plt.subplots(1, 3, figsize=(14, 4))
    for key in names:
        lo, hi = definition["ranges"][key]
        values = np.log(arrays[key] / lo) / np.log(hi / lo) if key == "diffusion" else (arrays[key] - lo) / (hi - lo)
        steps = np.concatenate([np.abs(np.diff(values, axis=axis)).flat for axis in (0, 1)])
        axes[0].hist(steps, bins=np.linspace(0, .15, 20), histtype="step", label=key)
    axes[0].set(xlabel="Adjacent normalized property change", ylabel="Neighbour pairs")
    axes[0].legend(fontsize=8)
    neighborhoods = data["analysis"]["neighborhoods"]
    mask = np.array([n["properties"]["impedance"] >= 9.6 and n["properties"]["diffusion"] <= .025
                     for n in neighborhoods]).reshape(16, 16).T
    axes[1].imshow(mask, origin="lower", vmin=0, vmax=1, cmap="Greens")
    axes[1].set(title="Affinity-weighted high-I / low-D coverage", xlabel="Chemical X", ylabel="Chemical Y")
    path = data["analysis"]["impedancePath"]
    axes[2].plot([table[s]["impedance"] for s in path["species"]], label="Impedance")
    axes[2].plot([table[s]["potential"] for s in path["species"]], label="Potential")
    axes[2].plot(np.arange(1, len(path["species"])), [s["usable"] for s in path["transitions"]], label="Usable energy per step")
    axes[2].set(xlabel="Successive unit-offset chemical steps", title="Reachable impedance-reduction path")
    axes[2].legend(fontsize=8)
    figure.suptitle(path["lawStatus"], fontsize=10)
    save(figure, root, "coverage-and-transitions")
    curves = json.loads((root / "law-samples.json").read_text())
    figure, axes = plt.subplots(1, 3, figsize=(14, 4))
    for curve in curves["affinity"]:
        axes[0].plot(curve["distance"], curve["response"], label=f"width {curve['width']}")
    axes[0].set(xlabel="Target distance from ID0", ylabel="Affinity")
    for key in ("movement", "diffusion"):
        axes[1].plot(curves["load"], curves[key], label=key)
    axes[1].set(xlabel="Impedance load", ylabel="Remaining fraction", xscale="log")
    for example in curves["targetMutations"]:
        axes[2].plot(example["steps"], example["response"], label=f"ID {example['species']}")
    axes[2].set(xlabel="Receptor X near chemical boundary", ylabel="Affinity")
    for axis in axes:
        axis.legend(fontsize=8)
        axis.grid(alpha=.2)
    figure.suptitle(curves["lawStatus"], fontsize=10)
    save(figure, root, "selected-law-responses")


if __name__ == "__main__":
    plot(Path(sys.argv[1]))
