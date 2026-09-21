"""Analyze registered cellular observations; never advance or modify a world."""
import argparse
import collections
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from cellular_metrics import checkpoint, lineage_ends, organization, diet_group
from integrated_review import read_lines, trajectory, flow_summaries, spatial_plot, web_plot


def temporal_plot(series, checkpoints, windows, output):
    fig, axes = plt.subplots(4, 2, figsize=(14, 15), constrained_layout=True)
    ticks = [r["tick"] for r in series]
    ct = [r["tick"] for r in checkpoints]
    epochs = [r["end"] for r in windows]
    for key in ["population", "biomass"]:
        axes[0, 0].plot(ticks, [r["summary"][key] for r in series], label=key)
    axes[0, 0].set_title("Living population and funded biomass")
    axes[0, 1].plot(ticks, [r["generation"] for r in series], label="Maximum living generation")
    axes[0, 1].plot(ticks, [len(r["lineages"]) for r in series], label="Surviving founder ancestries")
    axes[0, 1].set_title("Inherited turnover")
    axes[1, 0].fill_between(epochs, [r["feedImportShareBounds"][0] for r in windows],
                            [r["feedImportShareBounds"][1] for r in windows],
                            alpha=.25, label="IDs 0 + 136, bounded import share")
    axes[1, 0].plot(epochs, [r["reciprocalFraction"] for r in windows], label="Reciprocal reaction fraction")
    axes[1, 0].plot(epochs, [r["costs"]["contactImported"] / max(r["costs"]["imported"], 1e-30)
                            for r in windows], label="Contact / total uptake")
    axes[1, 0].set_title("Whole-population flux fractions")
    for key, label in [("halfFieldArea", "Area holding half the field"),
                       ("effectiveFieldArea", "Effective occupied field area")]:
        axes[1, 1].plot(ct, [r[key] for r in checkpoints], label=label)
    axes[1, 1].set_title("Chemical geography")
    for kind in ["inwardAbsent", "inwardShifted", "lightAbsent"]:
        axes[2, 0].plot(ct, [r["organization"].get("sensitivities", {}).get(kind, {}).get(
            "fundedOrConstructibleOver01", 0) / max(r["population"], 1) for r in checkpoints], label=kind)
    axes[2, 0].set_title("Controller responses > .01 on available actions")
    for count in range(9):
        values = [r["organization"].get("programCounts", {}).get(count, 0) / max(r["population"], 1)
                  for r in checkpoints]
        if max(values) > 0:
            axes[2, 1].plot(ct, values, label=f"{count} programs")
    axes[2, 1].set_title("Inherited enzyme repertoire fractions")
    axes[3, 0].plot(ticks[1:], [1e6 / r["timing"]["intervalMs"] for r in series[1:]], label="Recorded ticks/s")
    axes[3, 0].set_title("Execution including observations")
    for key in ["rss", "wasm"]:
        axes[3, 1].plot(ticks, [r["timing"][key] / 2**20 for r in series], label=key)
    axes[3, 1].set_title("Memory (MiB)")
    for ax in axes.flat:
        ax.legend(fontsize=8)
        ax.set_xlabel("Tick")
        ax.grid(alpha=.2)
    fig.savefig(output / "trajectory.png", dpi=160)
    fig.savefig(output / "trajectory.pdf")
    plt.close(fig)


def phenotype_plot(data, output):
    cells = data["cells"]
    if not cells:
        return
    fig, axes = plt.subplots(2, 2, figsize=(12, 9), constrained_layout=True)
    mass = np.array([sum(c["body"]) for c in cells])
    count = np.array([sum(c["organization"]["inheritedMachinery"]["programs"]) for c in cells])
    for n in sorted(set(count)):
        indices = np.flatnonzero(count == n)
        axes[0, 0].scatter(mass[indices], [cells[i]["energyFraction"] for i in indices],
                           s=10, alpha=.5, label=f"{n} programs ({len(indices)})")
    axes[0, 0].set(xscale="log", xlabel="Funded mass", ylabel="Energy / capacity")
    axes[0, 0].legend(fontsize=8)
    for ax, values, title in [(axes[0, 1], np.log10(mass), "Log10 funded mass"),
                              (axes[1, 0], count, "Inherited enzyme programs"),
                              (axes[1, 1], [c["organization"]["control"]["retirement"] for c in cells],
                               "Retirement request")]:
        scatter = ax.scatter([c["position"][0] for c in cells], [c["position"][1] for c in cells],
                             c=values, s=10, alpha=.7, cmap="viridis")
        ax.set(xlim=(0, data["config"]["width"]), ylim=(data["config"]["height"], 0), title=title)
        ax.set_aspect("equal")
        fig.colorbar(scatter, ax=ax, shrink=.75)
    fig.suptitle(f"Tick {data['tick']:,}: actual bodies and inherited repertoires")
    fig.savefig(output / "phenotypes.png", dpi=180)
    plt.close(fig)


def repertoires(data):
    groups = collections.defaultdict(list)
    for c in data["cells"]:
        groups[sum(c["organization"]["inheritedMachinery"]["programs"])].append(c)
    return {n: {"organization": organization(cells), "diet": diet_group(cells, data["tick"]),
                "biomass": sum(sum(c["body"]) for c in cells),
                "founders": dict(collections.Counter(c["lineage"] for c in cells))}
            for n, cells in groups.items()}


def budget_plot(series, checkpoints, windows, balances, output):
    fig, axes = plt.subplots(2, 2, figsize=(13, 9), constrained_layout=True)
    complete = [w for w in windows if w["end"] in {b["end"] for b in balances}]
    ticks = [w["end"] for w in complete]
    for key in ["maintenance", "repair", "motors", "construction", "learning"]:
        axes[0, 0].plot(ticks, [w["costs"][key] / w["organismSeconds"] for w in complete], label=key)
    axes[0, 0].plot(ticks, [w["netReactionWork"] / w["organismSeconds"] for w in complete],
                    color="black", linewidth=2, label="Net reaction work")
    axes[0, 0].set_title("Work per living cell-second, complete 10k windows")
    for key in ["overflowHeat", "divisionHeat", "deathHeat"]:
        axes[0, 1].plot(ticks, [b["heat"][key] / max(w["netReactionWork"], 1e-30)
                                for w, b in zip(complete, balances)], label=key)
    axes[0, 1].set_title("Lifecycle and capacity losses / net reaction work")
    ct = [c["tick"] for c in checkpoints]
    for key in ["motorPerCore", "photoPerCore"]:
        axes[1, 0].plot(ct, [c["body"][key][1] for c in checkpoints], label=key)
    axes[1, 0].set_title("Median funded stock / core")
    axes[1, 1].plot(ct, [c["body"]["energyFraction"][1] for c in checkpoints], label="Median stored work / capacity")
    axes[1, 1].plot([r["tick"] for r in series], [np.mean(r["light"]) for r in series],
                    label="Population-weighted illumination")
    axes[1, 1].set_title("Available work and experienced illumination")
    for ax in axes.flat:
        ax.legend(fontsize=8)
        ax.set_xlabel("Tick")
        ax.grid(alpha=.2)
    fig.savefig(output / "budgets.png", dpi=170)
    plt.close(fig)


def energy_balances(series, windows):
    """Reconcile signed metabolic work with expenses and actual stored energy."""
    indexed = {r["tick"]: r["summary"] for r in series}
    result = []
    for window in windows:
        if window["end"] not in indexed or "netReactionWork" not in window:
            continue
        before, after = [indexed[t] for t in [window["start"], window["end"]]]
        costs = sum(window["costs"][k] for k in ["maintenance", "motors", "learning", "transport",
                                                "construction", "refitting", "repair"])
        heat = {k: after["ledger"][k] - before["ledger"][k]
                for k in ["deathHeat", "divisionHeat", "overflowHeat"]}
        change = after["cellEnergy"] - before["cellEnergy"]
        residual = window["netReactionWork"] - costs - sum(heat.values()) - change
        assert abs(residual) < 1e-7 * max(1, abs(window["netReactionWork"])), "Cell energy does not reconcile"
        result.append({"start": window["start"], "end": window["end"], "expenses": costs,
                       "heat": heat, "storedEnergyChange": change, "residual": residual})
    return result


def reduce_checkpoints(paths):
    """Retain small ancestry/map records; decode only one full population at a time."""
    checkpoints, ancestry, maps = [], [], []
    final_tick = max(paths)
    final = None
    for tick, path in sorted(paths.items()):
        data = json.loads(path.read_text())
        checkpoints.append(checkpoint(data))
        ancestry.append({"tick": tick, "cells": [
            {**{k: c[k] for k in ["id", "born", "body", "target", "diet"]},
             "installed": {"programs": c["installed"]["programs"]}} for c in data["cells"]]})
        if tick in [0, 10000, 50000, 100000, 150000, final_tick]:
            maps.append({"tick": tick, "config": data["config"], "geography": data["geography"],
                         "cells": [{k: c[k] for k in ["position", "lineage"]} for c in data["cells"]]})
        if tick == final_tick:
            final = data
        del data
    return checkpoints, ancestry, maps, final


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--through", type=int, required=True)
    parser.add_argument("--ancestry", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    series = [r for r in trajectory(read_lines(args.directory / "trajectory/samples.jsonl"))
              if r["tick"] <= args.through]
    paths = {int(p.stem): p for p in (args.directory / "inspection").glob("*.json")}
    paths.update({int(p.stem): p for p in (args.directory / "repertoire").glob("*.json")})
    paths = {tick: path for tick, path in paths.items() if tick <= args.through}
    assert series[-1]["tick"] == max(paths) == args.through, "Endpoint evidence missing"
    checkpoints, inspections, maps, final = reduce_checkpoints(paths)
    for point in checkpoints:
        name = "initial.bin" if point["tick"] == 0 else f"checkpoint-{point['tick']}.bin"
        saved = args.directory / "trajectory" / name
        if saved.exists():
            point["checkpointBytes"] = saved.stat().st_size
    chemistry = final.get("chemistry")
    potentials = [p["potential"] for p in chemistry["properties"]] if chemistry else None
    windows = flow_summaries(args.directory / "flows.jsonl", potentials, args.through)
    assert windows[-1]["end"] == args.through, "Endpoint flow evidence missing"
    ancestry_data = json.loads(args.ancestry.read_text())
    assert ancestry_data["tick"] == args.through, "Ancestry endpoint mismatch"
    ancestry = lineage_ends(ancestry_data["ancestry"], inspections)
    balances = energy_balances(series, windows)
    result = {"trajectory": series, "checkpoints": checkpoints, "flowWindows": windows,
              "energyBalances": balances,
              "ancestry": ancestry, "lastRepertoires": repertoires(final)}
    (args.output / "summary.json").write_text(json.dumps(result, indent=2))
    temporal_plot(series, checkpoints, windows, args.output)
    spatial_plot(maps, args.output)
    web_plot(windows, args.output)
    phenotype_plot(final, args.output)
    budget_plot(series, checkpoints, windows, balances, args.output)
    print(json.dumps({"throughTick": series[-1]["tick"], "checkpoints": len(checkpoints),
                      "lastPopulation": series[-1]["population"], "output": str(args.output)}))


if __name__ == "__main__":
    main()
