"""Read registered environmental study artifacts without advancing a world."""
import argparse
import json
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def fraction(a, b):
    return a / b if b else None


def trait_index(path):
    traits = {}
    with path.open() as stream:
        for line in stream:
            row = json.loads(line)
            facts = row["facts"]
            traits[row["genotype"]["id"]] = {
                "body": facts["blueprint"],
                "chemistry": facts["expressed"]["chemistry"],
                "sourceImportCapacity": facts["sourceImportCapacity"],
            }
    return traits


def chemical_totals(sample, channel):
    return [sum(g["chemical"][channel][s] for g in sample["groups"]) for s in range(256)]


def recorded_expenses(flows):
    """Repair includes material-potential dissipation, so this is not a work-bank bill."""
    return sum(flows[k] for k in ["maintenance", "motors", "learning", "transport", "repair"])


def regional(sample, traits):
    result = []
    for lo, hi in [(0, 1 / 3), (1 / 3, 2 / 3), (2 / 3, 1.000001)]:
        members = [c for c in sample["habitats"] if lo <= c["weathering"][0] < hi]
        n = len(members)
        if not n:
            continue
        result.append({
            "ambientRange": [lo, min(hi, 1)], "cells": n,
            "populationShare": n / max(1, sample["population"]),
            "meanFundedBody": [sum(c["body"][i] for c in members) / n for i in range(15)],
            "meanTargetBody": [sum(traits[c["genome"]]["body"][i] for c in members) / n for i in range(15)],
            "meanLocalExposure": sum(c["weathering"][1] for c in members) / n,
            "meanShelter": sum(c["weathering"][2] for c in members) / n,
            "meanTargetMembrane": [sum(traits[c["genome"]]["chemistry"]["membrane"][axis] for c in members) / n for axis in ["x", "y"]],
            "meanBirthMembrane": [sum(c["chemistry"]["membrane"][axis] for c in members) / n for axis in ["x", "y"]],
        })
    return result


def geographic(sample, traits, dimensions):
    """Fixed 4x3 geographic bins, not inferred populations or ecological strategies."""
    bins = {}
    bodies = {c["id"]: c["body"] for c in sample["habitats"]}
    width, height = dimensions
    for cell in sample["cells"]:
        key = (int(cell["x"] * 4 / width), int(cell["y"] * 3 / height))
        bins.setdefault(key, []).append(cell)
    result = []
    for (x, y), cells in sorted(bins.items()):
        n = len(cells)
        result.append({
            "bin": [x, y], "cells": n, "populationShare": n / sample["population"],
            "meanTargetMotorCore": sum(traits[c["genome"]]["body"][1] / traits[c["genome"]]["body"][0] for c in cells) / n,
            "meanFundedMotorCore": sum(bodies[c["id"]][1] / bodies[c["id"]][0] for c in cells) / n,
            "meanTargetMembrane": [sum(traits[c["genome"]]["chemistry"]["membrane"][axis] for c in cells) / n for axis in ["x", "y"]],
        })
    return result


def sample_point(sample, source_ids, traits, previous, dimensions):
    summary = sample["summary"]
    ledger = summary["ledger"]
    imported = chemical_totals(sample, "imported")
    source = sum(imported[s] for s in source_ids)
    total = sum(imported)
    old_total, old_source = previous
    habitats = sample["habitats"]
    n = len(habitats)
    point = {
        "tick": sample["tick"], "population": n, "generation": summary["generation"],
        "lineages": summary["lineages"], "genomes": summary["genomes"],
        "divisions": ledger["divisions"], "biomass": summary["biomass"],
        "imported": total, "sourceIdentityImported": source,
        "nonSourceImportFraction": fraction(total - source, total),
        "intervalNonSourceImportFraction": fraction((total - source) - (old_total - old_source), total - old_total),
        "weathered": ledger["weatheredMaterial"], "suppressedConversion": ledger["shelteredConversion"],
        "weatheringHeat": ledger["weatheringHeat"],
        "captureLessRecordedExpenses": ledger["flows"]["captured"] - recorded_expenses(ledger["flows"]),
        "constructed": ledger["flows"]["constructed"], "motorWork": ledger["flows"]["motors"],
        "distance": ledger["flows"]["distance"],
        "meanAmbient": fraction(sum(c["weathering"][0] for c in habitats), n),
        "meanLocalExposure": fraction(sum(c["weathering"][1] for c in habitats), n),
        "meanShelter": fraction(sum(c["weathering"][2] for c in habitats), n),
        "meanFundedMotorCore": fraction(sum(c["body"][1] / c["body"][0] for c in habitats), n),
        "meanTargetMotorCore": fraction(sum(traits[c["genome"]]["body"][1] / traits[c["genome"]]["body"][0] for c in habitats), n),
        "meanDamage": fraction(sum(c["damage"] for c in sample["cells"]), n),
        "climateBands": regional(sample, traits),
        "geographicBins": geographic(sample, traits, dimensions),
        "resources": sample["resources"],
    }
    return point, (total, source)


def read_case(directory):
    result = load(directory / "result.json")
    manifest = load(directory / "manifest.json")
    traits = trait_index(directory / "genomes.jsonl")
    source_ids = manifest["config"]["sourceSpecies"]
    dimensions = (manifest["config"]["width"], manifest["config"]["height"])
    points, previous = [], (0, 0)
    with (directory / "samples.jsonl").open() as stream:
        for line in stream:
            sample = json.loads(line)
            point, previous = sample_point(sample, source_ids, traits, previous, dimensions)
            points.append(point)
    imported = chemical_totals(sample, "imported")
    exported = chemical_totals(sample, "exported")
    edges = {}
    for group in sample["groups"]:
        for edge in group["reactions"]:
            key = (edge["species"], edge["product"])
            edges[key] = edges.get(key, 0) + edge["amount"]
    f = result["final"]
    flows = f["ledger"]["flows"]
    consumed = chemical_totals(sample, "consumed")
    produced = chemical_totals(sample, "produced")
    reaction_drop = sum((a - b) * p["potential"] for a, b, p in zip(consumed, produced, manifest["chemistry"]["properties"]))
    net_reaction_work = reaction_drop - flows["reactionHeat"]
    top = lambda values: sorted(enumerate(values), key=lambda p: (-p[1], p[0]))[:12]
    return {
        "case": directory.name, "ledgerId": result["ledgerId"], "status": manifest["status"],
        "stop": result["stop"], "ticks": f["tick"], "population": f["population"],
        "generation": max(p["generation"] for p in points),
        "finalLivingGeneration": f["generation"], "divisions": f["ledger"]["divisions"],
        "lineages": f["lineages"], "ancestryRecords": f["ancestryRecords"],
        "ticksPerSecond": f["tick"] / (result["wallMs"] / 1000),
        "wallSeconds": result["wallMs"] / 1000,
        "maxEnergyResidual": result["maxResidual"],
        "maxMaterialResidual": result["maxMaterialResidual"],
        "sampledPeakRss": max(p["resources"]["rss"] for p in points),
        "sampledPeakWasm": max(p["resources"]["wasm"] for p in points),
        "artifactBytes": sum(p.stat().st_size for p in directory.iterdir() if p.is_file()),
        "nonSourceImportFraction": fraction(sum(v for s, v in enumerate(imported) if s not in source_ids), sum(imported)),
        "traceImportResidual": sum(imported) - flows["imported"],
        "captureLessRecordedExpenses": flows["captured"] - recorded_expenses(flows),
        "repairBaseWork": flows["repaired"] * manifest["config"]["repairEnergy"],
        "repairDissipation": flows["repair"],
        "reactionReferenceDrop": reaction_drop,
        "netReactionWork": net_reaction_work,
        "reactionWorkSpent": flows["captured"] - net_reaction_work,
        "flows": flows, "ledger": f["ledger"],
        "topImported": top(imported), "topExported": top(exported),
        "topReactions": [{"species": a, "product": b, "amount": q} for (a, b), q in sorted(edges.items(), key=lambda e: -e[1])[:24]],
        "fieldSpecies": sample["environment"]["extracellular"]["species"],
        "founderShares": [{"lineage": g["lineage"], "initialShare": g["initialCells"] / 48,
            "finalShare": fraction(g["living"], f["population"]), "living": g["living"],
            "constructed": g["ledger"]["flows"]["constructed"],
            "captureLessRecordedExpenses": g["ledger"]["flows"]["captured"] - recorded_expenses(g["ledger"]["flows"])} for g in sample["groups"]],
        "candidate": load(directory / "candidate.json")["observed"]["genome"] if (directory / "candidate.json").exists() else None,
        "sourceDigest": manifest["sourceDigest"], "binaryDigest": manifest["binaryDigest"],
        "harnessUnchanged": manifest["harnessDigest"] == manifest["harnessDigestAfter"],
        "points": points,
    }


def paired(cases):
    result = []
    by_name = {c["case"]: c for c in cases}
    for seed in [27, 101]:
        names = [f"main-{seed}-{arm}" for arm in ["on", "off"]]
        if any(n not in by_name for n in names):
            continue
        a, b = [by_name[n] for n in names]
        common = set(p["tick"] for p in a["points"]) & set(p["tick"] for p in b["points"])
        tick = max(common)
        ap, bp = [next(p for p in c["points"] if p["tick"] == tick) for c in [a, b]]
        result.append({"seed": seed, "matchedTick": tick, "on": ap, "off": bp})
    return result


def plot(cases, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(3, 2, figsize=(12, 11), constrained_layout=True)
    metrics = [("population", "Living cells"), ("intervalNonSourceImportFraction", "Non-source ID fraction of interval imports"),
               ("generation", "Maximum living generation"), ("meanLocalExposure", "Mean local weathering exposure"),
               ("constructed", "Cumulative constructed material"), ("rssMiB", "Sampled process RSS (MiB)")]
    for case in cases:
        if not case["case"].startswith("main-"):
            continue
        points = case["points"]
        for axis, (metric, title) in zip(axes.flat, metrics):
            ys = [p["resources"]["rss"] / 2 ** 20 if metric == "rssMiB" else p[metric] for p in points]
            axis.plot([p["tick"] for p in points], ys, label=case["case"], linewidth=1)
            axis.set_title(title)
            axis.set_xlabel("Tick")
            axis.grid(alpha=0.2)
    axes[0, 0].legend(fontsize=8)
    fig.suptitle("Environmental study — registered cases, actual stopping horizons")
    fig.savefig(output / "trajectories.png", dpi=160)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("study", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(exist_ok=False)
    cases = [read_case(p) for p in sorted(args.study.iterdir())
             if p.is_dir() and p.name.startswith(("pilot-", "main-")) and (p / "result.json").exists()]
    report = {"cases": cases, "paired": paired(cases),
              "limits": "Chemical identity is not atom provenance. Regions are descriptive. Family size is not a strategy or invasion result. Repair dissipation includes lost material potential; capture minus recorded expenses is the predeclared screening metric, not net usable-work profit. Memory peaks are sampled every1000ticks, not continuous OS peaks."}
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    plot(cases, args.output)
    rows = ["# Environmental study", "", report["limits"], "",
            "| Case | Stop | Ticks | Living | Max sampled generation | Non-source ID imports | Ticks/s | RSS MiB |", "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for c in cases:
        share = c["nonSourceImportFraction"]
        rows.append(f'| {c["case"]} | {c["stop"]} | {c["ticks"]:,} | {c["population"]} | {c["generation"]} | {100 * share:.2f}% | {c["ticksPerSecond"]:.1f} | {c["sampledPeakRss"] / 2 ** 20:.1f} |')
    rows += ["", "![Recorded trajectories](trajectories.png)", "", "Detailed flows, founder denominators, regional stocks and paired matched-tick observations are in report.json."]
    (args.output / "README.md").write_text("\n".join(rows) + "\n")


if __name__ == "__main__":
    main()
