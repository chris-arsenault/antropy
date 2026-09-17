"""Local figures for the default-seed observation; consumes already reduced measurements."""
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def finish(figure, output, name):
    figure.savefig(output / name, dpi=150)
    plt.close(figure)


def timeline(points, output):
    ticks = [p["tick"] for p in points]
    figure, axes = plt.subplots(4, 2, figsize=(15, 12), constrained_layout=True)
    series = [
        ("Living cells", [("population", "Living")]),
        ("Surviving founder families", [("familyCount", "Families")]),
        ("Divisions / deaths in preceding 250 ticks", [("divisions", "Divisions"), ("deaths", "Deaths")]),
        ("Reservoir activity", [("activeSources", "Active reservoirs")]),
        ("Imports and built material / cell-second", [("importsPerCellSecond", "Imports"), ("constructionPerCellSecond", "Built")]),
        ("Distance to nearest active reservoir", [("nearestActiveSourceMedian", "Population median")]),
        ("Mean fractional energy and damage", [("meanEnergyFraction", "Usable energy / capacity"), ("meanDamage", "Damage")]),
        ("Chemical share of interval imports", [("intervalNonFeedImportShare", "Outside raw feedstock IDs")]),
    ]
    for axis, (title, lines) in zip(axes.flat, series):
        for key, label in lines:
            axis.plot(ticks, [p["interval"][key] if key in ["divisions", "deaths"] else p[key] for p in points], label=label)
        axis.set(title=title, xlabel="Tick")
        axis.grid(alpha=.2)
        axis.legend(fontsize=8)
    finish(figure, output, "timeline.png")


def evolution(points, output):
    ticks = [p["tick"] for p in points]
    figure, axes = plt.subplots(3, 2, figsize=(15, 10), constrained_layout=True)
    families = sorted({int(k) for p in points for k in p["families"]})
    selected = [f for f in families if any(p["tick"] >= 5000 and p["families"].get(f, 0) for p in points)]
    for family in selected:
        axes[0, 0].plot(ticks, [p["families"].get(family, 0) / max(1, p["population"]) for p in points], label=f"Founder {family}")
    axes[0, 0].set(title="Whole-population shares of later-surviving families", ylim=(0, 1))
    axes[0, 0].legend(fontsize=8)
    for prefix in ["target", "funded"]:
        axes[0, 1].plot(ticks, [p["evolution"][prefix + "MotorCore"] for p in points], label=prefix)
    axes[0, 1].set(title="Motor/core ratio: inherited and installed")
    axes[0, 1].legend(fontsize=8)
    for i, label in [(0, "Core"), (1, "Motor"), (2, "Storage"), (7, "Transporter 0"), (8, "Transporter 1"), (11, "Enzyme 0"), (12, "Enzyme 1")]:
        base = points[0]["evolution"]["targetBodyMean"][i]
        axes[1, 0].plot(ticks, [p["evolution"]["targetBodyMean"][i] / base if p["population"] else np.nan for p in points], label=label)
    axes[1, 0].set(title="Mean inherited construction target / founder")
    axes[1, 0].legend(fontsize=7, ncol=2)
    for i, label in enumerate(["X", "Y"]):
        axes[1, 1].plot(ticks, [p["evolution"]["targetMembraneMean"][i] for p in points], label=label)
    axes[1, 1].set(title="Mean inherited membrane coordinates")
    axes[1, 1].legend(fontsize=8)
    for key, label in [("controllerDistance", "Inherited distance from founder"), ("acquiredChange", "Private acquired change")]:
        axes[2, 0].plot(ticks, [p[key]["median"] for p in points], label=label)
    axes[2, 0].set(title="RMS controller change: population median")
    axes[2, 0].legend(fontsize=7)
    for i, label in [(0, "Swim"), (1, "Absolute turn"), (2, "Repair"), (3, "Transport 0"), (4, "Transport 1")]:
        axes[2, 1].plot(ticks, [p["efforts"][i]["median"] for p in points], label=label)
    axes[2, 1].set(title="Actual efforts: population medians")
    axes[2, 1].legend(fontsize=7)
    for axis in axes.flat:
        axis.set_xlabel("Tick")
        axis.grid(alpha=.2)
    finish(figure, output, "evolution.png")


def chemistry(points, output):
    ticks = [p["tick"] for p in points]
    field = np.asarray([p["fieldSpecies"] for p in points])
    imported = np.asarray([p["intervalChemical"]["imported"] for p in points])
    chosen = np.argsort(-field.sum(0))[:8]
    diet = np.argsort(-imported.sum(0))[:8]
    figure, axes = plt.subplots(3, 2, figsize=(15, 10), constrained_layout=True)
    for species in chosen:
        axes[0, 0].plot(ticks, field[:, species], label=f"ID{species}")
    axes[0, 0].set(title="Extracellular standing material by chemical")
    for species in diet:
        total = imported.sum(1)
        axes[0, 1].plot(ticks, np.divide(imported[:, species], total, out=np.zeros_like(total), where=total > 0), label=f"ID{species}")
    axes[0, 1].set(title="Chemical shares of interval cell imports")
    for key, label in [("sourceReleased", "Reservoir release"), ("sourceConverted", "Reservoir conversion"), ("weatheredMaterial", "Weathered"), ("supplied", "External renewal")]:
        axes[1, 0].plot(ticks, [p["interval"][key] for p in points], label=label)
    axes[1, 0].set(title="Environmental material flows per observation interval")
    for key in ["captured", "maintenance", "motors", "construction", "repair", "transport"]:
        axes[1, 1].plot(ticks, [p["interval"]["flows"][key] / p["intervalOrganismSeconds"] if p["intervalOrganismSeconds"] else np.nan for p in points], label=key)
    axes[1, 1].set(title="Recorded work/expense flows per cell-second")
    for key in ["fieldMaterial", "sourceInventory"]:
        axes[2, 0].plot(ticks, [p[key] for p in points], label=key)
    axes[2, 0].set(title="Standing material: field and reservoirs")
    axes[2, 1].plot(ticks, [p["meanShelter"] for p in points], label="Population mean")
    axes[2, 1].set(title="Local chemical shelter")
    for axis in axes.flat:
        axis.set_xlabel("Tick")
        axis.grid(alpha=.2)
        axis.legend(fontsize=7, ncol=2)
    finish(figure, output, "chemistry.png")


def geography(points, config, output):
    figure, axes = plt.subplots(2, 3, figsize=(15, 8), constrained_layout=True)
    for axis, tick in zip(axes.flat, [5000, 10000, 20000, 30000, 40000, 50000]):
        p = min(points, key=lambda p: abs(p["tick"] - tick))
        for s in p["sources"]:
            color = "tab:orange" if s["remaining"] > 0 and s["inventory"] > 0 else "0.75"
            axis.add_patch(plt.Circle((s["x"], s["y"]), s["radius"], fill=False, color=color, alpha=.65))
        cells = p["positions"]
        axis.scatter([c[3] for c in cells], [c[4] for c in cells], c=[c[1] for c in cells],
                     cmap="viridis", vmin=1, vmax=48, s=8)
        axis.set(title=f'Tick {p["tick"]:,} · {p["population"]} cells', xlim=(0, config["width"]), ylim=(0, config["height"]), aspect="equal")
    figure.suptitle("Actual positions; orange active / gray dormant reservoirs; cells colored by founder ancestry")
    finish(figure, output, "geography.png")


def plot(report, output):
    timeline(report["points"], output)
    evolution(report["points"], output)
    chemistry(report["points"], output)
    geography(report["points"], report["manifest"]["config"], output)
