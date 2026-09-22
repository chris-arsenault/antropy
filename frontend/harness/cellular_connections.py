"""Historical v33 seed-27 analysis; requires its saved two-channel inspection JSON.

Reads evidence without advancing it. V34 uses scalar light and a different counterfactual
order, so its inspector output must not be substituted into this run-specific analysis.
"""
import argparse
import collections
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.spatial import cKDTree

from cellular_metrics import ENZYME_STOCKS, actions
from integrated_review import quantiles, read_lines, top

ROOTS = {15506: "north", 15640: "south-surviving", 15406: "south-lost", 16081: "periphery"}
CUT = 40000


def ancestry(base, through):
    records = json.loads((base / f"ancestry-{through}.json").read_text())["ancestry"]
    roots, labels = {}, {}
    bins = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    for a in sorted(records, key=lambda a: a["id"]):
        roots[a["id"]] = a["id"] if a["born"] <= CUT else roots[a["parent"]]
        labels[a["id"]] = ROOTS.get(roots[a["id"]], "other")
        if a["born"] > through or (a["ended"] is not None and a["ended"] <= CUT):
            continue
        label = labels[a["id"]]
        start, end = max(CUT, a["born"]), min(through, a["ended"] or through)
        for t in range(start // 1000 * 1000, end, 1000):
            bins[t][label]["cellTicks"] += max(0, min(end, t + 1000) - max(start, t))
        if a["ended"] is not None and CUT < a["ended"] <= through:
            bins[(a["ended"] - 1) // 1000 * 1000][label][a["cause"]] += 1
    return labels, bins


def group_cells(cells, labels):
    groups = collections.defaultdict(list)
    for c in cells:
        groups[labels[c["id"]]].append(c)
    return groups


def ratio(a, b):
    return float(a / b) if b else None


def source_sample(frame):
    cells = frame["cells"]
    size = [frame["width"], frame["height"]]
    tree = cKDTree(np.mod([[c["x"], c["y"]] for c in cells], size), boxsize=size)
    rows = []
    for i, (s, response) in enumerate(zip(frame["environment"]["sources"],
                                         frame["environment"]["sourceResponse"])):
        point = [s["habitat"]["x"], s["habitat"]["y"]]
        output = dict(response["outputRate"])
        rows.append({"index": i, "near6": len(tree.query_ball_point(point, 6)),
                     "near12": len(tree.query_ball_point(point, 12)),
                     "rate": sum(output.values()), "seedRate": output.get(0, 0) + output.get(136, 0),
                     "renewalSeed": s["mixture"][0] + s["mixture"][136],
                     "speed": float(np.linalg.norm(response["velocity"]))})
    return rows


def trajectory(base, labels, through):
    rows = []
    for frame in read_lines(base / "trajectory/samples.jsonl"):
        tick = frame["tick"]
        if tick > through:
            break
        groups = {}
        if tick >= CUT:
            for name, cells in group_cells(frame["cells"], labels).items():
                groups[name] = {"count": len(cells), "mass": sum(c["mass"] for c in cells),
                               "energyFraction": quantiles([c["energy"] / c["energyCapacity"] for c in cells]),
                               "inventoryFill": quantiles([c["material"] / c["capacity"] for c in cells]),
                               "radius": quantiles([c["radius"] for c in cells])}
        rows.append({"tick": tick, "groups": groups, "sources": source_sample(frame)})
    return rows


def flow_group(cells):
    flows = {k: sum(c["lastStepFlows"][k] for c in cells) for k in cells[0]["lastStepFlows"]}
    costs = ["repair", "maintenance", "motors", "learning", "construction", "refitting", "transport"]
    expense = sum(flows[k] for k in costs)
    imports = np.sum([c["chemicalFlows"]["imported"] for c in cells], axis=0)
    consumed = np.sum([c["chemicalFlows"]["consumed"] for c in cells], axis=0)
    produced = np.sum([c["chemicalFlows"]["produced"] for c in cells], axis=0)
    exports = np.sum([c["chemicalFlows"]["exported"] for c in cells], axis=0)
    return {"lastStepTotals": flows, "lastStepRepairExpenseShare": ratio(flows["repair"], expense),
            "lastStepCaptureToExpense": ratio(flows["captured"], expense),
            "lastStepContactImportShare": ratio(flows["contactImported"], flows["imported"]),
            "survivorImports": imports.tolist(), "survivorConsumed": consumed.tolist(),
            "survivorProduced": produced.tolist(), "survivorExports": exports.tolist(),
            "survivorImportedSeedShare": ratio(imports[0] + imports[136], imports.sum()),
            "survivorConsumedTop": top(consumed, 8),
            "withinCellConsumptionProductionOverlap": quantiles([
                ratio(np.minimum(c["chemicalFlows"]["consumed"], c["chemicalFlows"]["produced"]).sum(),
                      sum(c["chemicalFlows"]["consumed"])) or 0 for c in cells])}


def connection_group(cells, connections):
    rows = [connections[c["id"]] for c in cells if c["id"] in connections]
    if not rows:
        return {}
    signals = np.array([r["signals"] for r in rows])
    norms = np.linalg.norm(signals, axis=2)
    work = np.array([r["yields"]["requestedWorkRates"] for r in rows])
    rates = np.array([r["yields"]["requestedMaterialRate"] for r in rows])
    neutral = np.array([r["yields"]["neutralMixtureRate"] for r in rows])
    neutral_work = sum(r["yields"]["neutralMixtureWorkRate"] for r in rows)
    return {"rawSignalNormShare": (norms.sum(axis=0) / max(norms.sum(), 1e-30)).tolist(),
            "rawSignalComponentsMean": signals.mean(axis=0).tolist(),
            "bodySignalLargestCells": int(np.sum(np.argmax(norms, axis=1) == 2)),
            "requestedWorkRates": work.sum(axis=0).tolist(),
            "positiveWithoutBody": int(np.sum(work[:, 1] > 0)),
            "negativeWithoutBody": int(np.sum(work[:, 1] < 0)),
            "actualPositiveWithoutBodyNegative": int(np.sum((work[:, 0] > 0) & (work[:, 1] < 0))),
            "neutralMixtureWorkRate": neutral_work,
            "mixtureAggregateRateRatio": ratio(rates.sum(), neutral.sum()),
            "mixtureCellRateRatio": quantiles(rates / np.maximum(neutral, 1e-30)),
            "stimulatedMaterialRate": sum(r["yields"]["stimulatedMaterialRate"] for r in rows),
            "inhibitedMaterialRate": sum(r["yields"]["inhibitedMaterialRate"] for r in rows),
            "meanLightRelativeWorkDifference": ratio(np.abs(work[:, 0] - work[:, 3]).sum(), np.abs(work[:, 0]).sum())}


def detailed_group(cells, properties, tick, connections):
    body = np.array([c["body"] for c in cells])
    free = np.array([c["organization"]["freeChemistry"]["amounts"] for c in cells])
    bound = np.array([c["organization"]["boundChemistry"]["amounts"] for c in cells])
    profile = np.array([p["interaction"] for p in properties])
    free_moment, bound_moment = free @ profile, bound @ profile
    norms = np.linalg.norm(free_moment, axis=1) + np.linalg.norm(bound_moment, axis=1)
    inward_delta = np.array([np.abs(actions(c["organization"]["regulation"]["normal"]) -
                                  actions(c["organization"]["regulation"]["inwardAbsent"])) for c in cells])
    light_delta = np.array([np.abs(actions(c["organization"]["regulation"]["normal"]) -
                                 actions(c["organization"]["regulation"]["lightAbsent"])) for c in cells])
    mask = np.array([[c["body"][1] > 1e-6] * 2 + [True]
                     + [v > 1e-6 for v in c["body"][7:11]]
                     + [c["body"][s] > 1e-6 and active for s, active in
                        zip(ENZYME_STOCKS, c["installed"]["programs"])]
                     + [v > 1e-6 for v in c["target"]] + [True] for c in cells])
    inward_delta *= mask
    light_delta *= mask
    result = {"count": len(cells), "mass": float(body.sum()),
              "ageTicks": quantiles([tick - c["born"] for c in cells]),
              "generation": quantiles([c["generation"] for c in cells]),
              "medianMass": float(np.median(body.sum(axis=1))),
              "motorPerCore": quantiles(body[:, 1] / body[:, 0]),
              "photoPerCore": quantiles(body[:, 15] / body[:, 0]),
              "enzymePerCore": quantiles(body[:, ENZYME_STOCKS].sum(axis=1) / body[:, 0]),
              "storagePerCore": quantiles(body[:, 2] / body[:, 0]),
              "energy": quantiles([c["energyFraction"] for c in cells]),
              "light": [quantiles([c["light"][k] for c in cells]) for k in range(2)],
              "boundRetainedFraction": ratio(bound.sum(), bound.sum() + free.sum()),
              "boundMomentNormShare": quantiles(np.linalg.norm(bound_moment, axis=1) / np.maximum(norms, 1e-30)),
              "retainedResponse": np.mean([c["organization"]["retainedResponse"] for c in cells], axis=0).tolist(),
              "inwardEffectCountsByActionOver01": (inward_delta > .01).sum(axis=0).tolist(),
              "lightEffectCountsByActionOver01": (light_delta > .01).sum(axis=0).tolist(),
              "interface": quantiles([c["organization"]["fieldInterface"] for c in cells]),
              "programs": dict(collections.Counter(sum(c["installed"]["programs"]) for c in cells)),
              "effectivePrograms": quantiles([c["organization"]["effectiveInstalledPrograms"] for c in cells
                    if c["organization"].get("effectiveInstalledPrograms") is not None]),
              "chemistry": flow_group(cells), "connections": connection_group(cells, connections)}
    return result


def contact_groups(cells, labels):
    groups = collections.defaultdict(list)
    edges = collections.Counter()
    by_id = {c["id"]: c for c in cells}
    for c in cells:
        interface = c["organization"]["fieldInterface"]
        groups["fieldShareUnderQuarter" if interface < .25 else
               "fieldShareQuarterToHalf" if interface < .5 else "fieldShareOverHalf"].append(c)
        for n in c["organization"]["neighbors"]:
            if c["id"] < n["id"]:
                pair = tuple(sorted([labels[c["id"]], labels[n["id"]]]))
                edges["/".join(pair)] += 1
                assert n["id"] in by_id
    return {"edges": dict(edges), "groups": {k: {"count": len(v), "flows": flow_group(v)}
                                               for k, v in groups.items()}}


def overlap(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.minimum(a / max(a.sum(), 1e-30), b / max(b.sum(), 1e-30)).sum())


def checkpoints(base, labels, through):
    result = []
    properties = json.loads((base / "inspection/80000.json").read_text())["chemistry"]["properties"]
    for tick in range(CUT, through + 1, 10000):
        data = json.loads((base / f"inspection/{tick}.json").read_text())
        path = base / f"connections/{tick}.json"
        connections = {c["id"]: c for c in json.loads(path.read_text())["cells"]} if path.exists() else {}
        if "chemistry" in data:
            assert data["chemistry"]["properties"] == properties
        groups = {name: detailed_group(cells, properties, tick, connections)
                  for name, cells in group_cells(data["cells"], labels).items()}
        comparisons = []
        for a in groups:
            for b in groups:
                if a >= b:
                    continue
                comparisons.append({"a": a, "b": b, **{
                    key: overlap(groups[a]["chemistry"][key], groups[b]["chemistry"][key])
                    for key in ["survivorImports", "survivorConsumed", "survivorProduced"]}})
        result.append({"tick": tick, "groups": groups, "betweenGroups": comparisons,
                       "contacts": contact_groups(data["cells"], labels)})
        print(f"analyzed checkpoint {tick}", flush=True)
    return result


def plot(result, out):
    fig, axes = plt.subplots(3, 1, figsize=(12, 11), constrained_layout=True)
    frames = [r for r in result["trajectory"] if r["tick"] >= CUT]
    ticks = [r["tick"] / 1000 for r in frames]
    for name in [*ROOTS.values(), "other"]:
        axes[0].plot(ticks, [r["groups"].get(name, {}).get("count", 0) for r in frames], label=name)
    axes[0].set(ylabel="Living descendants", title="Complete descendant counts, branches defined at tick 40,000")
    axes[0].legend(ncol=3)
    for name in ["north", "south-surviving", "south-lost"]:
        values = [r["groups"].get(name, {}).get("energyFraction", [None, np.nan, None])[1] for r in frames]
        axes[1].plot(ticks, values, label=name)
    axes[1].set(ylabel="Median usable energy / capacity", ylim=(0, 1.02))
    axes[1].legend()
    for radius in [6, 12]:
        values = []
        for r in frames:
            sources = [s for s in r["sources"] if s[f"near{radius}"] > 0]
            values.append(ratio(sum(s["seedRate"] for s in sources), sum(s["rate"] for s in sources)))
        axes[2].plot(ticks, values, label=f"Within {radius} units of a cell")
    axes[2].set(xlabel="Tick (thousands)", ylabel="Seed-ID share of sampled source release", ylim=(0, 1.02))
    axes[2].legend()
    fig.savefig(out / "connections.png", dpi=160)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--through", type=int, default=180000)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    labels, bins = ancestry(args.directory, args.through)
    result = {"branchCut": CUT, "branchRoots": ROOTS, "through": args.through,
              "demography": bins, "trajectory": trajectory(args.directory, labels, args.through),
              "checkpoints": checkpoints(args.directory, labels, args.through)}
    frames = [r for r in result["trajectory"] if r["tick"] >= CUT]
    for a, b in zip(frames, frames[1:]):
        assert b["tick"] - a["tick"] == 1000
        for name in set(a["groups"]) | set(b["groups"]):
            events = bins[a["tick"]][name]
            before = a["groups"].get(name, {}).get("count", 0)
            after = b["groups"].get(name, {}).get("count", 0)
            assert after - before == events["division"] - events["starvation"]
    result["validation"] = {"completeBranchDemographyReconciles": True,
                            "snapshotChemistryPropertiesAgree": True,
                            "lastStepFlowCaveat": "Snapshots fall on physiology ticks. Some flows cover 0.8 model seconds and maintenance/motion cover 0.2. These are not whole-interval expense ratios."}
    (args.output / "connections.json").write_text(json.dumps(result, separators=(",", ":")) + "\n")
    plot(result, args.output)


if __name__ == "__main__":
    main()
