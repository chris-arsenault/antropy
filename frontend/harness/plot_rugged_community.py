"""Plot archived physical observations locally; never advance or publish a world."""

import json
from pathlib import Path
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def frames(directory):
    with (directory / "traces.json").open() as source:
        return json.load(source)


def series(directory, group, value):
    observations = frames(directory)
    return (
        [frame["tick"] for frame in observations],
        [sum(cell[value] for cell in frame["cells"] if cell["group"] == group)
         for frame in observations],
    )


def plot(output):
    artifacts = Path(__file__).parent / "artifacts"
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.3), layout="constrained")
    directory = artifacts / "rugged-community-i2-shared/parent-neighbor"
    for group, label, color in [
        (5, "Changed key: consumes intermediate", "#187e73"),
        (6, "Parent key: cannot repay costs", "#ac453b"),
    ]:
        axes[0].plot(*series(directory, group, "boundBiomass"), label=label, color=color)
    axes[0].set(title="Neighbors in the same producer world", ylabel="Living biomass", xlabel="Model ticks")
    axes[0].annotate("Parent starves at 241", xy=(241, 0), xytext=(295, 0.9),
                     arrowprops={"arrowstyle": "->", "color": "#ac453b"}, fontsize=9)
    axes[0].legend(fontsize=8, loc="upper left")

    for condition, label, color, style in [
        ("parent-food", "Parent: food alone", "#187e73", "-"),
        ("parent-food-136", "Parent: same food + intermediate", "#ac453b", "-"),
        ("protected-parent-food-136", "Membrane change: food + intermediate", "#906719", "--"),
    ]:
        directory = artifacts / f"rugged-community-i3-harm/{condition}"
        axes[1].plot(*series(directory, 2, "energy"), label=label, color=color, linestyle=style)
    axes[1].set(title="Added intermediate, no competition", ylabel="Living usable energy", xlabel="Model ticks")
    axes[1].annotate("Starvation at 183", xy=(183, 0), xytext=(145, 0.17),
                     arrowprops={"arrowstyle": "->", "color": "#ac453b"}, fontsize=9)
    axes[1].legend(fontsize=8, loc="upper right")
    for axis in axes:
        axis.grid(alpha=0.15)
        axis.set_ylim(bottom=0)
    fig.suptitle("Rugged binding: exported intermediate becomes fuel or an unfunded burden", fontsize=12)
    fig.savefig(output, dpi=170)
    plt.close(fig)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Expected NEW_LOCAL_PNG_PATH")
    destination = Path(sys.argv[1])
    if destination.exists():
        raise SystemExit("Refusing to overwrite existing evidence")
    plot(destination)
