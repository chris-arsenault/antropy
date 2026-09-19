"""Reduce recorded cycles and read-only checkpoint extractions; no simulation execution."""
import argparse
from collections import Counter
import json
from pathlib import Path
import numpy as np


def load(path):
    return json.loads(path.read_text())


def ancestors(identity, ancestry):
    while identity is not None:
        yield identity
        identity = ancestry[identity]["parent"]


def interval(first, last):
    a, b = first["ledger"], last["ledger"]
    seconds = last["organismSeconds"] - first["organismSeconds"]
    amounts = [y - x for x, y in zip(first["chemical"]["imported"], last["chemical"]["imported"])]
    return {
        "ticks": [first["tick"], last["tick"]],
        "population": [first["population"], last["population"]],
        "divisions": b["divisions"] - a["divisions"],
        "deaths": b["deaths"] - a["deaths"],
        "organismSeconds": seconds,
        "flowsPerCellSecond": {k: (v - a["flows"][k]) / seconds if seconds else None for k, v in b["flows"].items()},
        "importShares": {str(i): amount / sum(amounts) for i, amount in enumerate(amounts) if amount > 0},
        "chemical": {k: [y - x for x, y in zip(first["chemical"][k], last["chemical"][k])]
                     for k in first["chemical"]},
        "reactions": {k: v - first["reactions"].get(k, 0) for k, v in last["reactions"].items()},
        "fieldMaterial": [first["fieldMaterial"], last["fieldMaterial"]],
    }


def ancestry_summary(points, ancestry):
    final_tick = max(points)
    final_ids = [p[0] for p in points[final_tick]["positions"]]
    paths = [list(ancestors(i, ancestry)) for i in final_ids]
    common = set(paths[0]).intersection(*map(set, paths[1:])) if paths else set()
    cuts = []
    for tick in points:
        if tick % 2500 != 0:
            continue
        living = {p[0] for p in points[tick]["positions"]}
        counts = Counter(next(i for i in path if i in living) for path in paths)
        cuts.append({"tick": tick, "living": len(living), "ancestorsOfFinalCells": dict(counts)})
    families = {}
    for row in ancestry.values():
        families.setdefault(row["lineage"], []).append(row)
    return {
        "records": len(ancestry),
        "causes": dict(Counter(row["cause"] for row in ancestry.values())),
        "familyExtinctionTicks": {str(f): max(row["ended"] for row in rows)
                                  for f, rows in families.items() if all(row["ended"] is not None for row in rows)},
        "retrospectiveCuts": cuts,
        "finalCommonAncestor": ancestry[max(common)] if common else None,
        "finalOldest": sorted([ancestry[i] for i in final_ids], key=lambda a: a["born"])[:8],
    }


def capacity_blocks(ceiling, config):
    """Optimistic capacity bounds at full growth and zero damage, not a division prediction."""
    storage = ceiling[:, 2] * config["storageCapacity"]
    energy = ceiling[:, 0] * config["energyCapacity"]
    if "daughterInventoryFraction" not in config:
        # Archived reports retain their original absolute-allowance interpretation.
        return (storage < 2 * config["daughterInventory"],
                energy < 2 * config["daughterEnergy"] + config["divisionCost"])
    upkeep = (ceiling[:, 0] * config["maintenance"] + ceiling[:, 1] * config["motorMaintenance"]
              + ceiling[:, 2] * config["storageMaintenance"]
              + ceiling[:, 3:].sum(axis=1) * config["machineryMaintenance"]
              + 2 * config["controllerCost"])
    if config["learning"] == "plastic":
        upkeep += ceiling[:, 0] * config["plasticityCost"]
    reserve = np.maximum(energy * config["daughterEnergyFraction"],
                         upkeep * (config["physiologyInterval"] + config["dt"]))
    required = reserve + ceiling[:, 0] * config["divisionWorkPerCore"]
    return storage < storage * config["daughterInventoryFraction"], energy < required


def local_summary(path, genotypes, config):
    sample = load(path)
    cells = sample["cells"]
    count = len(cells)
    species = sorted(set(config["sourceSpecies"] + [170, 178, 185, 186, 187, 202]))
    families = {}
    for family in sorted({c["cell"]["lineage"] for c in cells}):
        rows = [r for r in cells if r["cell"]["lineage"] == family]
        bodies = np.asarray([r["cell"]["body"] for r in rows])
        targets = np.asarray([genotypes[str(r["cell"]["genome"])]["body"] for r in rows])
        population = len(rows)
        # With fixed alleles, ordinary growth stops at twice each target. Existing
        # inherited excess is retained. Check the largest attainable storage/core.
        ceiling = np.maximum(bodies, 2 * targets)
        inventory_block, energy_block = capacity_blocks(ceiling, config)
        families[family] = {
            "population": population,
            "targetBodyMean": targets.mean(0).tolist(),
            "targetBodyMedian": np.median(targets, axis=0).tolist(),
            "fundedBodyMean": bodies.mean(0).tolist(),
            "targetMotorCoreMean": float(np.mean(targets[:, 1] / targets[:, 0])),
            "fundedMotorCoreMean": float(np.mean(bodies[:, 1] / bodies[:, 0])),
            "zeroMotorTargets": int(np.count_nonzero(targets[:, 1] == 0)),
            "divisionCapacityBlocked": int(np.count_nonzero(inventory_block | energy_block)),
            "divisionInventoryBlocked": int(np.count_nonzero(inventory_block)),
            "divisionEnergyBlocked": int(np.count_nonzero(energy_block)),
            "localConcentrationMean": {s: sum(r["local"][s] for r in rows) / population for s in species},
            "meanDamage": sum(r["cell"]["damage"] for r in rows) / population,
            "meanEnergyFraction": sum(r["cell"]["energy"] / (r["cell"]["body"][0] * config["energyCapacity"])
                                      for r in rows) / population,
            "ageMedianTicks": float(np.median([sample["tick"] - r["cell"]["born"] for r in rows])),
            "generationRange": [min(r["cell"]["generation"] for r in rows), max(r["cell"]["generation"] for r in rows)],
            "actualSwimMean": sum(r["cell"]["action"]["swim"] for r in rows) / population,
            "actualTransportMean": np.mean([r["cell"]["action"]["transport"] for r in rows], axis=0).tolist(),
            "installedMembraneMean": np.mean([[r["cell"]["installed"]["membrane"][k] for k in ["x", "y"]]
                                              for r in rows], axis=0).tolist(),
        }
    return {
        "tick": sample["tick"], "population": count,
        "localConcentrationMean": {str(s): sum(c["local"][s] for c in cells) / count if count else None for s in species},
        "mobilityMean": sum(c["mobility"] for c in cells) / count if count else None,
        "shelterMean": sum(c["weathering"][2] for c in cells) / count if count else None,
        "families": families,
    }


def ancestral_chemical_steps(points, ancestry, genotypes):
    """Large observed allele steps on ancestry reaching the endpoint, not a fitness test."""
    ids = {i for c in points[max(points)]["positions"] for i in ancestors(c[0], ancestry)}
    genomes = {ancestry[i]["genome"] for i in ids}
    changes = []
    for identity in sorted(genomes):
        g = genotypes.get(str(identity))
        parent = genotypes.get(str(g["parent"])) if g else None
        if not parent:
            continue
        for category, axes in [("enzymes", ["x", "y", "dx", "dy"]),
                               ("transporters", ["x", "y"]), ("receptors", ["x", "y"])]:
            for slot, (before, after) in enumerate(zip(parent["chemistry"][category], g["chemistry"][category])):
                for axis in axes:
                    axis = {"dx": "centerX", "dy": "centerY"}.get(axis, axis) if "centerX" in after else axis
                    if abs(after[axis] - before[axis]) >= 4:
                        changes.append({"genome": identity, "parent": g["parent"], "born": g["born"],
                                        "category": category, "slot": slot, "axis": axis,
                                        "before": before[axis], "after": after[axis]})
    return sorted(changes, key=lambda r: (r["born"], r["genome"]))


def family_intervals(points):
    selected = [p for p in points.values() if p["tick"] % 5000 == 0 or p["tick"] == max(points)]
    result = []
    for first, last in zip(selected, selected[1:]):
        before = {g["lineage"]: g for g in first["familyFlows"]}
        rows = []
        for g in last["familyFlows"]:
            b = before[g["lineage"]]
            seconds = g["organismSeconds"] - b["organismSeconds"]
            if not seconds:
                continue
            rows.append({
                "lineage": g["lineage"], "livingBefore": b["living"], "livingAfter": g["living"],
                "organismSeconds": seconds,
                "divisions": g["ledger"]["divisions"] - b["ledger"]["divisions"],
                "deaths": g["ledger"]["deaths"] - b["ledger"]["deaths"],
                "flowsPerCellSecond": {k: (v - b["ledger"]["flows"][k]) / seconds
                                       for k, v in g["ledger"]["flows"].items()},
                "chemical": {k: [y - x for x, y in zip(b["chemical"][k], values)]
                             for k, values in g["chemical"].items()},
            })
        result.append({"ticks": [first["tick"], last["tick"]], "families": rows})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    report = load(args.study / "report/report.json")
    points = {p["tick"]: p for p in report["points"]}
    ancestry = {a["id"]: a for a in load(args.study / "readout/ancestry.json")}
    genotypes = report["genotypes"]
    selected = []
    selected_ticks = sorted({0, max(points)} | {t for t in points if t % 5000 == 0}
                            | {p["tick"] for p in report["extrema"]})
    for tick in selected_ticks:
        p = points[tick]
        keys = ["tick", "population", "families", "generation", "evolution", "controllerDistance",
                "acquiredChange", "meanEnergyFraction", "meanDamage", "meanShelter", "activeSources",
                "nearestActiveSourceMedian", "fieldMaterial", "sourceInventory", "efforts"]
        row = {k: p[k] for k in keys}
        allele_counts = Counter()
        for g, n in p["genomeCounts"].items():
            allele_counts[str(genotypes[g]["plasticity"][1])] += n
        row["plasticityAllele1Counts"] = dict(allele_counts)
        row["sourceImportCapacityMean"] = [sum(genotypes[g]["sourceImportCapacity"][i] * n
                                               for g, n in p["genomeCounts"].items()) / p["population"]
                                           if p["population"] else None for i in [0, 1]]
        ranked = sorted(p["positions"], key=lambda c: (genotypes[str(c[2])]["body"][1] /
                                                      genotypes[str(c[2])]["body"][0], c[0]))
        if ranked:
            representative = ranked[len(ranked) // 2]
            row["representativeCell"] = representative[0]
            row["representativeGenome"] = genotypes[str(representative[2])]
        selected.append(row)
    final = points[max(points)]
    epoch_ticks = sorted({0, max(points)} | {t for t in points if t % 5000 == 0})
    reversal_ticks = sorted({p["tick"] for p in report["extrema"]})
    result = {
        "manifest": report["manifest"], "result": report["result"],
        "samples": len(points), "sampledGenotypes": len(genotypes),
        "ancestry": ancestry_summary(points, ancestry), "selected": selected,
        "ancestralChemicalStepsAtLeastFourUnits": ancestral_chemical_steps(points, ancestry, genotypes),
        "extrema": report["extrema"],
        "epochs": [interval(points[a], points[b]) for a, b in zip(epoch_ticks, epoch_ticks[1:])],
        "episodes": [interval(points[a], points[b]) for a, b in zip(reversal_ticks, reversal_ticks[1:])],
        "familyEpochs": family_intervals(points),
        "localCheckpoints": [local_summary(path, genotypes, report["manifest"]["config"])
                             for path in sorted((args.study / "readout").glob("local-*.json"),
                                                key=lambda p: int(p.stem.split("-")[1]))],
        "finalChemical": final["chemical"], "finalReactions": final["reactions"],
        "resourcesPeakSampled": {k: max(p["resources"][k] for p in points.values()) for k in ["rss", "wasm"]},
        "limits": report["limits"] + " Representative genomes are the upper median living cell by target motor/core, ties by cell ID. Retrospective ancestry cuts describe endpoint descendants only. Local readouts cover all living cells at saved checkpoints without advancing ticks. Capacity blocks assume unchanged alleles and the ordinary growth ceiling; they are mechanical constraints, not a new survival assay.",
    }
    assert result["ancestry"]["records"] == report["manifest"]["config"]["founders"] + final["ledger"]["births"]
    assert sum(a["cause"] not in ["alive", "division"] for a in ancestry.values()) == final["ledger"]["deaths"]
    assert sum(a["cause"] == "alive" for a in ancestry.values()) == final["population"]
    with args.output.open("x") as handle:
        json.dump(result, handle, indent=2, allow_nan=False)
    print(json.dumps({"output": str(args.output), "ancestry": result["ancestry"],
                      "resources": result["resourcesPeakSampled"]}))


if __name__ == "__main__":
    main()
