"""Read-only reductions for v33 cellular organization; classifications are descriptive."""
import collections

import numpy as np
from scipy.spatial import cKDTree

from integrated_review import cell_group, nearest, quantiles, top

ENZYME_STOCKS = [11, 12, 13, 14, 16, 17, 18, 19]
TINY_INVENTORY = 1e-12  # Reporting threshold only; no physical state is changed.


def actions(a):
    return np.array([a["swim"], a["turn"], a["repair"], *a["transport"],
                     *a["activity"], *a["allocation"], a["retirement"]])


def distribution(values):
    return dict(sorted(collections.Counter(int(v) for v in values).items()))


def total_chemicals(cells, key):
    return np.sum([c["chemicalFlows"][key] for c in cells], axis=0) if cells else np.zeros(256)


def organization(cells):
    if not cells:
        return {"count": 0}
    body = np.array([c["body"] for c in cells])
    gene = np.array([c["organization"]["inheritedMachinery"]["programs"] for c in cells])
    installed = np.array([c["installed"]["programs"] for c in cells])
    inward = np.array([c["installed"]["inward"] for c in cells])
    controls = [c["organization"]["control"] for c in cells]
    activity = np.array([a["activity"] for a in controls])
    allocation = np.array([a["allocation"] for a in controls])
    funded = (body[:, ENZYME_STOCKS] > 1e-6) & installed
    retirement = np.array([a["retirement"] for a in controls])
    relative = body[:, ENZYME_STOCKS] / body[:, 0, None]
    mass = body.sum(axis=1)
    sensitivities = {}
    for kind in ["inwardAbsent", "inwardShifted", "lightAbsent"]:
        differences, relevant = [], []
        for c in cells:
            probe = c["organization"]["regulation"]
            delta = np.abs(actions(probe[kind]) - actions(probe["normal"]))
            mask = np.array([c["body"][1] > 1e-6] * 2 + [True]
                            + [v > 1e-6 for v in c["body"][7:11]]
                            + [c["body"][s] > 1e-6 and active for s, active in
                               zip(ENZYME_STOCKS, c["installed"]["programs"])]
                            + [v > 1e-6 for v in c["target"]] + [True])
            differences.append(delta)
            relevant.append(delta * mask)
        delta, relevant = np.array(differences), np.array(relevant)
        sensitivities[kind] = {
            "allRequestsOver01": int(np.sum(delta.max(axis=1) > .01)),
            "fundedOrConstructibleOver01": int(np.sum(relevant.max(axis=1) > .01)),
            "fundedOrConstructibleOver001": int(np.sum(relevant.max(axis=1) > .001)),
            "meanAbsoluteByAction": relevant.mean(axis=0).tolist(),
            "magnitude": quantiles(relevant.max(axis=1)),
        }
    means = [r["weightedMean"] for c in cells for r in c["organization"]["rateModifiers"]
             if r["weightedMean"] is not None]
    contacts = [len(c["organization"]["neighbors"]) for c in cells]
    mixtures = np.array([c["organization"]["retainedResponse"] for c in cells])
    return {
        "count": len(cells), "programCounts": distribution(gene.sum(axis=1)),
        "fundedProgramCounts": distribution(funded.sum(axis=1)),
        "effectiveInstalledPrograms": quantiles([c["organization"]["effectiveInstalledPrograms"]
            for c in cells if c["organization"].get("effectiveInstalledPrograms") is not None]),
        "enzymePerCore": quantiles(relative.sum(axis=1)),
        "retiredMass": float((body[:, ENZYME_STOCKS] * ~installed).sum()),
        "retiredMassFraction": float((body[:, ENZYME_STOCKS] * ~installed).sum() / mass.sum()),
        "retirementEffort": quantiles(retirement), "retirementOver01": int(np.sum(retirement > .01)),
        "inwardAllocatedOver01": int(np.sum(np.any(inward > .01, axis=1))),
        "fundedInwardOver01": int(np.sum(np.any(inward * body[:, 3:7] > .01 * body[:, 0, None], axis=1))),
        "inwardAllocationMaximum": quantiles(inward.max(axis=1)),
        "activeEnzymeRequests": quantiles(activity[funded]),
        "cellsWithSuppressedFundedEnzyme": int(np.sum(np.any((activity < .5) & funded, axis=1))),
        "cellsWithSelectiveActivity": int(np.sum([len(a) > 1 and np.ptp(a) > .25 for a in
                                                   [row[mask] for row, mask in zip(activity, funded)]])),
        "constructionRequestsByStock": [quantiles(allocation[:, s]) for s in range(20)],
        "contacts": {"cells": int(np.sum(np.array(contacts) > 0)), "edges": int(sum(contacts) / 2),
                     "neighbors": quantiles(contacts),
                     "fieldInterface": quantiles([c["organization"]["fieldInterface"] for c in cells])},
        "retainedProfile": [quantiles(mixtures[:, s]) for s in range(2)],
        "rateModifiers": quantiles(means), "sensitivities": sensitivities,
        "acquiredRms": quantiles([c["organization"]["regulation"]["acquiredRms"] for c in cells]),
    }


def diet_group(cells, tick):
    eligible = [c for c in cells if tick - c["born"] >= 100 and c["diet"]["imports"] >= .01]
    alternatives = [c for c in eligible if c["diet"]["source0"] + c["diet"]["source136"]
                    < .5 * c["diet"]["imports"]]
    single = [c for c in eligible if c["diet"]["top"][0][0] not in [0, 136]
              and c["diet"]["top"][0][1] > .5 * c["diet"]["imports"]]
    imported = total_chemicals(cells, "imported")
    consumed = total_chemicals(cells, "consumed")
    produced = total_chemicals(cells, "produced")
    exported = total_chemicals(cells, "exported")
    return {
        "eligible": len(eligible), "majorityNonseed": len(alternatives),
        "majoritySingleNonseed": len(single),
        "dominantImportCounts": dict(collections.Counter(c["diet"]["top"][0][0] for c in eligible)),
        "alternativeIds": [c["id"] for c in alternatives],
        "survivorLifetimeTotals": {"imported": float(imported.sum()), "consumed": float(consumed.sum()),
                                    "produced": float(produced.sum()), "exported": float(exported.sum())},
        "survivorImportSeedShare": float((imported[0] + imported[136]) / imported.sum()) if imported.sum() else None,
        "imports": top(imported, 12), "exports": top(exported, 12),
        "consumed": top(consumed, 12), "produced": top(produced, 12),
        "consumptionBeyondLifetimeImports": float(np.maximum(consumed - imported, 0).sum()),
    }


def communities(data):
    """Use the existing radius-6 neighborhood scale; no strategy clustering or fitness labels."""
    cells = data["cells"]
    if not cells:
        return []
    size = np.array([data["config"]["width"], data["config"]["height"]])
    positions = np.mod([c["position"] for c in cells], size)
    parent = list(range(len(cells)))

    def root(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for a, b in cKDTree(positions, boxsize=size).query_pairs(6):
        parent[root(a)] = root(b)
    groups = collections.defaultdict(list)
    for i, c in enumerate(cells):
        groups[root(i)].append(c)
    result = []
    for group in sorted(groups.values(), key=len, reverse=True):
        positions = np.array([c["position"] for c in group])
        angles = positions / size * 2 * np.pi
        center = np.mod(np.arctan2(np.sin(angles).mean(axis=0), np.cos(angles).mean(axis=0)), 2 * np.pi)
        result.append({"count": len(group), "center": (center * size / (2 * np.pi)).tolist(),
                       "biomass": sum(sum(c["body"]) for c in group),
                       "founders": dict(collections.Counter(c["lineage"] for c in group)),
                       "mass": quantiles([sum(c["body"]) for c in group]),
                       "targetCore": quantiles([c["target"][0] for c in group]),
                       "energyFraction": quantiles([c["energyFraction"] for c in group]),
                       "motorPerCore": quantiles([c["body"][1] / c["body"][0] for c in group]),
                       "photoPerCore": quantiles([c["body"][15] / c["body"][0] for c in group]),
                       "damage": quantiles([c["damage"] for c in group]),
                       "light": quantiles([np.mean(c["light"]) for c in group]),
                       "externalDrive": [quantiles([c["organization"]["externalDrive"][k] for c in group
                            if "externalDrive" in c["organization"]]) for k in range(2)],
                       "diet": diet_group(group, data["tick"]),
                       "programs": distribution(sum(c["installed"]["programs"]) for c in group),
                       "cellIds": [c["id"] for c in group]})
    return result


def checkpoint(data):
    cells, geo = data["cells"], data["geography"]
    mass = np.array(geo["material"])
    cumulative = np.cumsum(np.sort(mass)[::-1])
    half = np.searchsorted(cumulative, mass.sum() / 2) + 1 if mass.sum() else 0
    size = [data["config"]["width"], data["config"]["height"]]
    source_inventory = np.sum([s["inventory"] for s in geo["sources"]], axis=0)
    renewal = np.mean([s["composition"] for s in geo["sources"]], axis=0)
    free_values = np.array([c["organization"]["freeChemistry"]["amounts"] for c in cells]) if cells else np.zeros((0, 256))
    free = free_values.sum(axis=0)
    bound = np.sum([c["organization"]["boundChemistry"]["amounts"] for c in cells], axis=0) if cells else np.zeros(256)
    return {
        "tick": data["tick"], "population": len(cells), "body": cell_group(cells),
        "organization": organization(cells), "diet": diet_group(cells, data["tick"]),
        "communitiesRadius6": communities(data),
        "sourceNearest": nearest(np.array([s["position"] for s in geo["sources"]]), size),
        "cellNearest": nearest(np.array([c["position"] for c in cells]), size),
        "halfFieldArea": float(half / len(mass)),
        "effectiveFieldArea": float(mass.sum() ** 2 / max(np.square(mass).sum(), 1e-30) / len(mass)),
        "activeGroups": geo["activeGroups"], "activeGroupFraction": geo["activeGroups"] / (len(mass) * 64),
        "fieldTop": top(geo["species"], 12), "sourceInventoryTop": top(source_inventory, 12),
        "renewalTop": top(renewal, 12), "renewalSeedShare": float(renewal[0] + renewal[136]),
        "freeTop": top(free, 12), "boundTop": top(bound, 12),
        "privateInventorySupport": {
            "positivePerCell": float((free_values > 0).sum() / max(1, len(cells))),
            "subnormalPerCell": float(((free_values > 0) & (free_values < np.finfo(float).tiny)).sum() / max(1, len(cells))),
            "tinyThreshold": TINY_INVENTORY,
            "tinyEntriesPerCell": float(((free_values > 0) & (free_values < TINY_INVENTORY)).sum() / max(1, len(cells))),
            "tinyMassShare": float(free_values[free_values < TINY_INVENTORY].sum() / max(free.sum(), 1e-30)),
            "occupiedEnzymeRowsPerCell": sum(r["rowsWithSubstrate"] for c in cells
                for r in c["organization"]["rateModifiers"]) / max(1, len(cells)),
        },
    }


def lineage_ends(records, inspections):
    ancestors = {a["id"]: a for a in records}
    final = inspections[-1]
    ends = collections.defaultdict(collections.Counter)
    for a in records:
        if a["ended"] is not None:
            ends[str((a["ended"] - 1) // 1000 * 1000)][a["cause"]] += 1
    cohorts, transitions = [], []
    comparisons = [(d, final, cohorts) for d in inspections[1:-1]]
    comparisons += [(a, b, transitions) for a, b in zip(inspections, inspections[1:])]
    for checkpoint_data, endpoint, destination in comparisons:
        cut = checkpoint_data["tick"]
        counts = collections.Counter()
        for cell in endpoint["cells"]:
            ancestor = ancestors[cell["id"]]
            while ancestor["born"] > cut:
                ancestor = ancestors[ancestor["parent"]]
            counts[ancestor["id"]] += 1
        index = {c["id"]: c for c in checkpoint_data["cells"]}
        assert set(counts).issubset(index)
        destination.append({"tick": cut, "end": endpoint["tick"],
                            "initialCount": len(index), "contributingAncestors": len(counts),
                        "descendants": [{"id": cid, "count": n, "fraction": n / len(endpoint["cells"]),
                                         "mass": sum(index[cid]["body"]), "coreTarget": index[cid]["target"][0],
                                         "programs": sum(index[cid]["installed"]["programs"]),
                                         "diet": index[cid]["diet"]} for cid, n in counts.most_common()]})
    return {"records": len(records), "endsBy1000Ticks": dict(ends),
            "finalSurvivorCohorts": cohorts, "nextCheckpointCohorts": transitions}
