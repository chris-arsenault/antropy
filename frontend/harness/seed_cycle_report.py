"""Read the authorized default-seed trajectory; never advance or modify simulation state."""
import argparse
from collections import Counter
import json
import math
from pathlib import Path

import numpy as np

from evolve_chemistry import records


def load(path):
    return json.loads(path.read_text())


def mean(values):
    return sum(values) / len(values) if values else None


def fraction(a, b):
    return a / b if b else None


def top(values, count=8):
    return sorted(enumerate(values), key=lambda x: (-x[1], x[0]))[:count]


def genes(path):
    result, reference = {}, None
    for row in records(path):
        g, f = row["genotype"], row["facts"]
        behavior = f["expressed"]["behavior"]
        weights = np.asarray(behavior["weights"])
        if reference is None:
            reference = weights
        delta = weights - reference
        result[g["id"]] = {
            "id": g["id"], "parent": g["parent"], "born": g["born"],
            "mutated": g["mutated"], "learned": g["learned"],
            "body": f["blueprint"], "chemistry": f["expressed"]["chemistry"],
            "sourceImportCapacity": f["sourceImportCapacity"],
            "physical": f["expressed"]["physical"], "plasticity": behavior["plasticity"],
            "controllerBlocksRmsFromFounder": {
                name: float(np.sqrt(np.mean(delta[a:b] ** 2)))
                for name, a, b in [("inputs", 0, 936), ("recurrent", 936, 1512),
                                   ("hiddenBias", 1512, 1536), ("outputs", 1536, 1752),
                                   ("outputBias", 1752, 1761)]},
            "outputBias": weights[1752:].tolist(),
            "largestWeightChanges": [[int(i), float(reference[i]), float(weights[i])]
                                     for i in np.argsort(-np.abs(delta))[:8]],
        }
    return result


def chemical(sample, channel):
    return np.sum([g["chemical"][channel] for g in sample["groups"]], axis=0).tolist()


def distance(cell, source, config):
    h = source["habitat"]
    delta = [(cell[k] - h[k] + config[size] / 2) % config[size] - config[size] / 2
             for k, size in [("x", "width"), ("y", "height")]]
    return math.hypot(*delta)


def inheritance(cells, bodies, genotypes):
    targets = [genotypes[c["genome"]]["body"] for c in cells]
    chemicals = [genotypes[c["genome"]]["chemistry"] for c in cells]
    funded = [bodies[c["id"]]["body"] for c in cells]
    result = {}
    for label, values in [("target", targets), ("funded", funded)]:
        result[label + "BodyMean"] = np.mean(values, axis=0).tolist() if values else []
        result[label + "MotorCore"] = mean([v[1] / v[0] for v in values])
    result["targetMembraneMean"] = [mean([g["membrane"][axis] for g in chemicals]) for axis in ["x", "y"]]
    result["installedMembraneMean"] = [mean([bodies[c["id"]]["installed"]["membrane"][axis] for c in cells]) for axis in ["x", "y"]]
    return result


def summarize(sample, previous, genotypes, config):
    cells, habitats = sample["cells"], sample["habitats"]
    bodies = {h["id"]: h for h in habitats}
    n, tick = len(cells), sample["tick"]
    summary, env = sample["summary"], sample["environment"]
    ledger = summary["ledger"]
    families = Counter(c["lineage"] for c in cells)
    counts = Counter(c["genome"] for c in cells)
    source_ids = config["sourceSpecies"]
    sources = env["sources"]
    active = [s for s in sources if s["remaining"] > 0 and sum(s["inventory"]) > 0]
    distances = [min((distance(c, s, config) for s in active), default=None) for c in cells]
    near = sum(any(distance(c, s, config) <= s["habitat"]["radius"] * 3 for s in active) for c in cells)
    flows = {channel: chemical(sample, channel) for channel in ["imported", "exported", "consumed", "produced"]}
    interval = {k: [a - b for a, b in zip(v, previous["chemical"][k] if previous else [0.] * 256)]
                for k, v in flows.items()}
    old_ledger = previous["ledger"] if previous else ledger
    changes = {k: ledger[k] - old_ledger[k] for k in ledger if k != "flows"}
    changes["flows"] = {k: v - old_ledger["flows"][k] for k, v in ledger["flows"].items()}
    seconds = sum(g["organismSeconds"] for g in sample["groups"])
    elapsed = seconds - previous["organismSeconds"] if previous else 0
    imports = sum(interval["imported"])
    population = sample["populationTraits"]["population"]
    inspections = [{"id": i["cell"]["id"], "lineage": i["cell"]["lineage"],
                    "genome": i["cell"]["genome"], "x": i["cell"]["x"], "y": i["cell"]["y"],
                    "action": i["cell"]["action"], "local": i["local"],
                    "mobility": i["mobility"], "weathering": i["weathering"],
                    "inventory": i["cell"]["inventory"], "damage": i["cell"]["damage"]}
                   for i in sample["inspections"]]
    point = {
        "tick": tick, "population": n, "biomass": summary["biomass"],
        "generation": summary["generation"], "families": dict(families),
        "familyCount": len(families), "genomeCounts": dict(counts),
        "distinctSequences": population["evolution"]["distinctSequences"],
        "controllerDistance": population["evolution"]["controllerDistance"],
        "acquiredChange": population["evolution"]["acquiredChange"],
        "efforts": population["efforts"], "evolution": inheritance(cells, bodies, genotypes),
        "meanEnergyFraction": mean([c["energy"] / c["energyCapacity"] for c in cells]),
        "meanDamage": mean([c["damage"] for c in cells]),
        "meanShelter": mean([h["weathering"][2] for h in habitats]),
        "activeSources": len(active), "sourceInventory": sum(sum(s["inventory"]) for s in sources),
        "releaseRate": sum(q for r in env["sourceResponse"] for _, q in r["outputRate"]),
        "nearestActiveSourceMedian": float(np.median([d for d in distances if d is not None])) if active and cells else None,
        "cellsWithinThreeSourceRadii": near, "fieldSpecies": env["extracellular"]["species"],
        "fieldMaterial": env["extracellular"]["amount"], "fieldPotential": env["extracellular"]["potential"],
        "chemical": flows, "intervalChemical": interval, "ledger": ledger,
        "interval": changes, "organismSeconds": seconds, "intervalOrganismSeconds": elapsed,
        "importsPerCellSecond": fraction(imports, elapsed),
        "constructionPerCellSecond": fraction(changes["flows"]["constructed"], elapsed),
        "intervalNonFeedImportShare": fraction(sum(q for s, q in enumerate(interval["imported"]) if s not in source_ids), imports),
        "familyFlows": [{"lineage": g["lineage"], "living": g["living"], "organismSeconds": g["organismSeconds"],
                         "ledger": g["ledger"], "chemical": g["chemical"]} for g in sample["groups"]],
        "positions": [[c["id"], c["lineage"], c["genome"], c["x"], c["y"]] for c in cells],
        "sources": [{"x": s["habitat"]["x"], "y": s["habitat"]["y"], "radius": s["habitat"]["radius"],
                     "remaining": s["remaining"], "wait": s["wait"], "rate": s["rate"],
                     "inventory": sum(s["inventory"])} for s in sources],
        "reactions": {f'{e["species"]}>{e["product"]}': 0. for g in sample["groups"] for e in g["reactions"]},
        "inspections": inspections, "resources": sample["resources"],
    }
    for g in sample["groups"]:
        for e in g["reactions"]:
            point["reactions"][f'{e["species"]}>{e["product"]}'] += e["amount"]
    assert n == sum(families.values()) == sum(counts.values())
    assert config["founders"] + ledger["divisions"] - ledger["deaths"] == n
    assert abs(sum(flows["imported"]) - ledger["flows"]["imported"]) < 1e-6
    return point


def extrema(points):
    """Descriptive reversals of at least10 cells and25%; endpoints retain their labels."""
    if not points:
        return []
    direction = 1 if len(points) < 2 or points[1]["population"] >= points[0]["population"] else -1
    candidate = points[0]
    result = []
    for p in points[1:]:
        difference = p["population"] - candidate["population"]
        threshold = max(10, candidate["population"] * 0.25)
        if direction >= 0 and difference >= 0 or direction <= 0 and difference <= 0:
            candidate = p
        elif abs(difference) >= threshold:
            result.append({"tick": candidate["tick"], "population": candidate["population"],
                           "kind": "peak" if difference < 0 else "trough"})
            direction = 1 if difference > 0 else -1
            candidate = p
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    manifest, result = load(args.case / "manifest.json"), load(args.case / "result.json")
    genotypes = genes(args.case / "genomes.jsonl")
    points = []
    for sample in records(args.case / "samples.jsonl"):
        points.append(summarize(sample, points[-1] if points else None, genotypes, manifest["config"]))
    args.output.mkdir(exist_ok=False)
    report = {"manifest": manifest, "result": {k: v for k, v in result.items() if k not in ["series", "frames"]},
              "points": points, "genotypes": genotypes, "extrema": extrema(points),
              "limits": "One unmodified trajectory. Founder families and exact genomes are ancestry/identity, not species or demonstrated strategies. Imports identify species, not source atoms. Nearest-source distance is a spatial proxy. Inspections sample at most eight families every1000ticks; population statistics use all living cells."}
    (args.output / "report.json").write_text(json.dumps(report, separators=(",", ":"), allow_nan=False))
    from seed_cycle_plots import plot
    plot(report, args.output)
    print(json.dumps({"ledger": result["ledgerId"], "ticks": points[-1]["tick"],
                      "samples": len(points), "sampledGenotypes": len(genotypes), "extrema": report["extrema"]}))


if __name__ == "__main__":
    main()
