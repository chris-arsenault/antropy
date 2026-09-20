"""Reduce registered v31 observations without advancing any simulation state."""
import argparse
import collections
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch
import numpy as np
from scipy.spatial import cKDTree


def read_lines(path):
    with path.open() as stream:
        for line in stream:
            if not line.endswith("\n"):
                break  # The running producer may be writing its last record.
            yield json.loads(line)


def quantiles(values):
    return np.quantile(values, [.1, .5, .9]).tolist() if len(values) else [None] * 3


def nearest(points, size):
    if len(points) < 2:
        return {"rms": None, "quantiles": [None] * 3}
    distances = cKDTree(np.mod(points, size), boxsize=size).query(points, k=2)[0][:, 1]
    return {"rms": float(np.sqrt(np.mean(distances ** 2))), "quantiles": quantiles(distances)}


def top(values, limit=8):
    values = np.asarray(values)
    total = float(values.sum())
    return [[int(s), float(values[s]), float(values[s] / total) if total else 0]
            for s in np.argsort(values)[::-1][:limit] if values[s] > 0]


def cell_group(cells):
    if not cells:
        return {"count": 0}
    body = np.array([c["body"] for c in cells])
    target = np.array([c["target"] for c in cells])
    normal = np.array([c["optical"]["normal"] for c in cells])
    sensitivities = {}
    for kind in ["absent", "brighter", "reverse"]:
        delta = np.array([c["optical"][kind] for c in cells]) - normal
        magnitude = np.max(np.abs(delta), axis=1)
        sensitivities[kind] = {
            "over001": int(np.count_nonzero(magnitude > .001)),
            "over01": int(np.count_nonzero(magnitude > .01)),
            "quantiles": quantiles(magnitude),
            "meanAbsoluteByAction": np.abs(delta).mean(axis=0).tolist(),
            "meanSignedByAction": delta.mean(axis=0).tolist(),
        }
    return {
        "count": len(cells), "mass": quantiles(body.sum(axis=1)),
        "core": quantiles(body[:, 0]), "motorPerCore": quantiles(body[:, 1] / body[:, 0]),
        "motorless": int(np.count_nonzero(body[:, 1] <= 1e-6)),
        "photoPerCore": quantiles(body[:, 15] / body[:, 0]),
        "photoTargetPerCore": quantiles(target[:, 15] / target[:, 0]),
        "unbuiltPhoto": int(np.count_nonzero(body[:, 15] <= 1e-6)),
        "energyFraction": quantiles([c["energyFraction"] for c in cells]),
        "damage": quantiles([c["damage"] for c in cells]),
        "light": quantiles([np.mean(c["light"]) for c in cells]),
        "generation": quantiles([c["generation"] for c in cells]),
        "meanAction": np.array([c["action"] for c in cells]).mean(axis=0).tolist(),
        "sensitivities": sensitivities,
    }


def checkpoint(data):
    cells = data["cells"]
    by_lineage = collections.defaultdict(list)
    for cell in cells:
        by_lineage[cell["lineage"]].append(cell)
    groups = {}
    for lineage, group in by_lineage.items():
        lifetime = data["survivorLifetimeGroups"][str(lineage)]
        groups[str(lineage)] = {**cell_group(group), "lifetimeSeconds": lifetime["survivorAgeSeconds"],
                               "lifetimeTotals": {k: sum(lifetime[k]) for k in ["imports", "exports", "consumed", "produced"]},
                               **{k: top(lifetime[k]) for k in ["imports", "exports", "consumed", "produced"]}}
    geo = data["geography"]
    material = np.array(geo["material"])
    sorted_mass = np.sort(material)[::-1]
    half = int(np.searchsorted(np.cumsum(sorted_mass), material.sum() * .5)) + 1
    species = geo["species"]
    size = [data["config"]["width"], data["config"]["height"]]
    area = np.prod(size)
    sources = np.array([s["position"] for s in geo["sources"]])
    positions = np.array([c["position"] for c in cells])
    eligible = [c for c in cells if data["tick"] - c["born"] >= 100
                and c.get("diet", {}).get("imports", 0) >= .01]
    alternatives = [c for c in eligible if c["diet"]["source0"] + c["diet"]["source136"]
                    < .5 * c["diet"]["imports"]]
    return {"tick": data["tick"], "population": len(cells), "groups": groups,
            "individualDietAvailable": all("diet" in c for c in cells),
            "dietEligible": len(eligible), "majorityNonfeedImporters": alternatives,
            "world": cell_group(cells), "topChemicals": top(species),
            "chemical186Share": species[186] / sum(species) if sum(species) else 0,
            "cellNearest": nearest(positions, size), "sourceNearest": nearest(sources, size),
            "halfMaterialAreaFraction": half * geo["spacing"] ** 2 / area,
            "effectiveMaterialAreaFraction": float(material.sum() ** 2 / max(1e-30, sum(material ** 2))
                                                    * geo["spacing"] ** 2 / area),
            "activeGroupFraction": geo["activeGroups"] / (geo["nx"] * geo["ny"] * 64)}


def flow_summaries(path):
    bins = {}
    last_end = 0
    for f in read_lines(path):
        window = f["window"]
        assert window["start"] == last_end, "Missing or overlapping accepted-flow window"
        last_end = window["end"]
        total = sum(r["amount"] for r in f["rows"])
        assert abs(total - f["activity"]["flows"]["reacted"]) < 1e-7 * max(1, total)
        epoch = (f["tick"] - 1) // 10000
        if epoch not in bins:
            bins[epoch] = {"start": window["start"], "end": 0, "routes": collections.Counter(),
                           "imports": collections.Counter(), "exports": collections.Counter(),
                           "importTotal": 0., "exportTotal": 0., "costs": collections.Counter(),
                           "organismSeconds": 0., "overflow": 0.}
        b = bins[epoch]
        b["end"] = window["end"]
        for row in f["rows"]:
            b["routes"][(row["input"], row["output"])] += row["amount"]
        for kind in ["imports", "exports"]:
            for species, value in f["activity"][kind]["rows"]:
                b[kind][species] += value
            b["importTotal" if kind == "imports" else "exportTotal"] += f["activity"][kind]["total"]
        b["costs"].update(f["activity"]["flows"])
        b["organismSeconds"] += f["activity"]["organismSeconds"]
        b["overflow"] += f["activity"]["overflow"]
    result = []
    for b in bins.values():
        routes = b.pop("routes")
        total = sum(routes.values())
        feed = sum(b["imports"][s] for s in [0, 136])
        other = b["importTotal"] - sum(b["imports"].values())
        reciprocal = sum(min(q, routes[(v, u)]) for (u, v), q in routes.items())
        probabilities = np.array(list(routes.values())) / total if total else np.array([])
        significant = probabilities[probabilities > 0]
        b.update({"topRoutes": [[u, v, q, q / total if total else 0]
                                for (u, v), q in routes.most_common(12)],
                  "consumed0": sum(q for (u, _), q in routes.items() if u == 0),
                  "produced0": sum(q for (_, v), q in routes.items() if v == 0),
                  "consumed136": sum(q for (u, _), q in routes.items() if u == 136),
                  "produced136": sum(q for (_, v), q in routes.items() if v == 136),
                  "routeCount": len(routes), "reactionTotal": total,
                  "effectiveRoutes": float(np.exp(-sum(significant * np.log(significant)))),
                  "routesFor99Percent": int(np.searchsorted(np.cumsum(np.sort(probabilities)[::-1]), .99)) + 1,
                  "reciprocalFraction": reciprocal / total if total else 0,
                  "feedImportShareBounds": [feed / b["importTotal"],
                                             (feed + max(0, other)) / b["importTotal"]]
                  if b["importTotal"] else [0, 0]})
        for kind in ["imports", "exports"]:
            b[kind] = b[kind].most_common(12)
        result.append(b)
    return result


def trajectory(rows):
    result = []
    for r in rows:
        species = r["environment"]["extracellular"]["species"]
        light = r["phenotypes"]["groups"][0]["illumination"]
        result.append({"tick": r["tick"], "population": r["population"],
                       "lineages": dict(collections.Counter(c["lineage"] for c in r["cells"])),
                       "generation": r["summary"]["generation"],
                       "fieldMaterial": sum(species), "topChemicals": top(species, 4),
                       "chemical186Share": species[186] / sum(species),
                       "light": light, "timing": r["timing"], "summary": r["summary"]})
    return result


def plot_series(series, checkpoints, flows, path):
    ticks = [r["tick"] for r in series]
    fig, axes = plt.subplots(3, 2, figsize=(13, 11), constrained_layout=True)
    lineages = sorted({int(k) for r in series for k in r["lineages"]})
    alive = sorted(lineages, key=lambda k: max(r["lineages"].get(k, 0) for r in series), reverse=True)[:6]
    counts = [[r["lineages"].get(k, 0) for r in series] for k in alive]
    counts.append([r["population"] - sum(r["lineages"].get(k, 0) for k in alive) for r in series])
    axes[0, 0].stackplot(ticks, counts, labels=[*[f"Founder {k}" for k in alive], "Others"])
    axes[0, 0].set_title("Population by founder ancestry")
    axes[0, 0].legend(fontsize=8, ncol=2)
    axes[0, 1].plot(ticks, [np.mean(r["light"]) for r in series], label="Cell-weighted light")
    for axis in range(2):
        axes[0, 1].plot(ticks, [r["light"][axis] for r in series], alpha=.45, lw=.8,
                        label=f"Response {axis + 1}")
    axes[0, 1].axhline(1, color="gray", lw=.7)
    axes[0, 1].set_title("Local illumination (geographic mean = 1)")
    axes[0, 1].legend(fontsize=8)
    epochs = [b["end"] for b in flows]
    axes[1, 0].plot(epochs, [b["feedImportShareBounds"][0] * 100 for b in flows], label="Source-ID share, lower")
    axes[1, 0].plot(epochs, [b["reciprocalFraction"] * 100 for b in flows], label="Reciprocal conversion share")
    axes[1, 0].set_title("Accepted flux, 10k-tick windows (%)")
    axes[1, 0].legend(fontsize=8)
    ct = [r["tick"] for r in checkpoints]
    axes[1, 1].plot(ct, [r["world"]["mass"][1] for r in checkpoints], label="Median funded mass")
    axes[1, 1].set_yscale("log")
    axes[1, 1].set_title("Typical cell mass")
    axes[2, 0].plot(ct, [100 * r["world"]["sensitivities"]["absent"]["over01"] / r["population"]
                        for r in checkpoints], label="Optical removal changes action > .01")
    axes[2, 0].plot(ct, [100 * r["world"]["sensitivities"]["brighter"]["over001"] / r["population"]
                        for r in checkpoints], label="Small tonic perturbation changes action > .001")
    axes[2, 0].set_title("Frozen-state controller sensitivity (% of cells)")
    axes[2, 0].legend(fontsize=8)
    axes[2, 1].plot(ticks[1:], [1e6 / r["timing"]["intervalMs"] for r in series[1:]])
    axes[2, 1].set_title("Observed execution speed (ticks/s, including recording)")
    for ax in axes.flat:
        ax.set_xlabel("Tick")
        ax.grid(alpha=.2)
    fig.savefig(path / "trajectory.png", dpi=160)
    fig.savefig(path / "trajectory.pdf")
    plt.close(fig)


def spatial_plot(inspections, path):
    chosen = [d for d in inspections if d["tick"] in [0, 10000, 50000, 100000, 150000, 200000]]
    fig, axes = plt.subplots(2, 3, figsize=(15, 8), constrained_layout=True)
    maximum = max(float(np.log1p(d["geography"]["material"]).max()) for d in chosen)
    for ax, data in zip(axes.flat, chosen):
        g, c = data["geography"], data["config"]
        field = np.array(g["material"]).reshape(g["ny"], g["nx"])
        ax.imshow(np.log1p(field), extent=[0, c["width"], c["height"], 0], cmap="Greys",
                  vmin=0, vmax=maximum, alpha=.65)
        for lineage in sorted({cell["lineage"] for cell in data["cells"]}):
            cells = [cell for cell in data["cells"] if cell["lineage"] == lineage]
            ax.scatter([cell["position"][0] for cell in cells], [cell["position"][1] for cell in cells],
                       s=3, color=plt.get_cmap("tab20")((lineage % 20) / 20), alpha=.65)
        source = np.array([s["position"] for s in g["sources"]])
        ax.scatter(source[:, 0], source[:, 1], marker="+", s=24, c="darkorange", linewidths=.8)
        ax.set_title(f"Tick {data['tick']:,} · {len(data['cells']):,} cells")
        ax.set_xlim(0, c["width"])
        ax.set_ylim(c["height"], 0)
        ax.set_aspect("equal")
    for ax in list(axes.flat)[len(chosen):]:
        ax.set_visible(False)
    fig.savefig(path / "spatial.png", dpi=180)
    plt.close(fig)


def web_plot(flows, path):
    chosen = [flows[0], flows[min(9, len(flows) - 1)], flows[-1]]
    fig, axes = plt.subplots(1, 3, figsize=(14, 5), constrained_layout=True)
    for ax, window in zip(axes, chosen):
        nodes = set()
        for u, v, _, fraction in window["topRoutes"]:
            nodes.update([u, v])
            start, end = (u // 16, u % 16), (v // 16, v % 16)
            ax.add_patch(FancyArrowPatch(start, end, connectionstyle="arc3,rad=.15",
                                        arrowstyle="-|>", mutation_scale=10,
                                        lw=.5 + 6 * np.sqrt(fraction), alpha=.65, color="#386a99",
                                        shrinkA=7, shrinkB=7))
        for node in nodes:
            ax.scatter(node // 16, node % 16, c="#f1b34b" if node in [0, 136] else "#dce7ee",
                       edgecolors="#34495e", s=75, zorder=3)
            ax.annotate(str(node), (node // 16, node % 16), xytext=(5, 7), textcoords="offset points", fontsize=8)
        shown = sum(r[3] for r in window["topRoutes"]) * 100
        ax.set_title(f"Ticks {window['start']:,}–{window['end']:,}\nTop routes: {shown:.1f}% of accepted flow")
        ax.set(xlim=(-1, 16), ylim=(16, -1), xlabel="Chemical X", ylabel="Chemical Y")
        ax.set_aspect("equal")
        ax.grid(alpha=.15)
    fig.savefig(path / "chemical-web.png", dpi=180)
    plt.close(fig)


def ancestry_review(directory, inspections):
    path = directory / "ancestry.json"
    if not path.exists():
        return None
    records = json.loads(path.read_text())["ancestry"]
    ancestors = {a["id"]: a for a in records}
    final = inspections[-1]
    cohorts = {}
    for cut in [50000, 100000, 150000]:
        if cut >= final["tick"]:
            continue
        counts = collections.Counter()
        for cell in final["cells"]:
            ancestor = ancestors[cell["id"]]
            while ancestor["born"] > cut:
                ancestor = ancestors[ancestor["parent"]]
            assert ancestor["ended"] is None or ancestor["ended"] > cut
            counts[ancestor["id"]] += 1
        cohort = next(d for d in inspections if d["tick"] == cut)
        indexed = {c["id"]: c for c in cohort["cells"]}
        assert set(counts).issubset(indexed)
        cohorts[str(cut)] = {"initialCells": len(indexed), "contributingAncestors": len(counts),
                             "descendants": [{"id": cid, "count": n, "cellAtCut": indexed[cid]}
                                             for cid, n in counts.most_common()]}
    candidates = {}
    for data in inspections:
        for cell in checkpoint(data)["majorityNonfeedImporters"]:
            cid = cell["id"]
            family = {cid}
            family_ends = collections.Counter()
            for ancestor in records:
                if ancestor["id"] == cid or ancestor["parent"] in family:
                    family.add(ancestor["id"])
                    family_ends[ancestor["cause"]] += 1
            candidates[str(cid)] = {"sampleTick": data["tick"], "diet": cell["diet"],
                                     "ancestor": ancestors[cid],
                                     "familyCounts": dict(family_ends),
                                     "children": [a for a in records if a["parent"] == cid]}
    deaths = collections.defaultdict(collections.Counter)
    for a in records:
        if a["ended"] is not None:
            deaths[str((a["ended"] - 1) // 1000 * 1000)][a["cause"]] += 1
    return {"finalTick": final["tick"], "cohorts": cohorts,
            "alternativeImportCandidates": candidates, "endsBy1000Ticks": dict(deaths)}


def final_phenotypes(directory, output):
    path = directory / "final-detail.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    result = {}
    fig, axes = plt.subplots(1, 2, figsize=(12, 5), constrained_layout=True)
    # Descriptive separation in the final mass gap; no population classifier or selection.
    for name, color, large in [("Mass > 10", "#ac4374", True), ("Remaining cells", "#297a92", False)]:
        cells = [c for c in data["cells"] if (sum(c["body"]) > 10) == large]
        mass = [sum(c["body"]) for c in cells]
        chemicals = {k: np.sum([c["chemicalFlows"][k] for c in cells], axis=0)
                     for k in ["imported", "exported", "consumed", "produced"]}
        result[name] = {**cell_group(cells), "totalMass": sum(mass),
                        "coreTarget": quantiles([c["target"][0] for c in cells]),
                        "ageTicks": quantiles([data["tick"] - c["born"] for c in cells]),
                        "lifetimeChemicalTotals": {k: float(v.sum()) for k, v in chemicals.items()},
                        "lifetimeChemicalTop": {k: top(v, 12) for k, v in chemicals.items()}}
        axes[0].scatter(mass, [c["body"][15] / c["body"][0] for c in cells], c=color, s=20,
                        label=f"{name}: {len(cells)}")
        axes[1].scatter([c["position"][0] for c in cells], [c["position"][1] for c in cells],
                        c=color, s=12 if not large else 35, alpha=.75)
    axes[0].set(xscale="log", xlabel="Funded cell mass", ylabel="Photoreceptor / core stock",
                title="Distinct funded bodies at tick 200,000")
    axes[0].legend()
    axes[1].set(xlim=(0, data["config"]["width"]), ylim=(data["config"]["height"], 0),
                xlabel="World X", ylabel="World Y", title="Locations of the same cells")
    axes[1].set_aspect("equal")
    for ax in axes:
        ax.grid(alpha=.15)
    fig.savefig(output / "final-phenotypes.png", dpi=180)
    plt.close(fig)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    rows = list(read_lines(args.directory / "trajectory/samples.jsonl"))
    inspections = [json.loads(p.read_text()) for p in sorted((args.directory / "inspection").glob("*.json"),
                                                            key=lambda p: int(p.stem))]
    series = trajectory(rows)
    checkpoints = [checkpoint(d) for d in inspections]
    flows = flow_summaries(args.directory / "flows.jsonl")
    result = {"trajectory": series, "checkpoints": checkpoints, "flowWindows": flows,
              "ancestry": ancestry_review(args.directory, inspections),
              "finalPhenotypes": final_phenotypes(args.directory, args.output)}
    (args.output / "summary.json").write_text(json.dumps(result, indent=2))
    plot_series(series, checkpoints, flows, args.output)
    spatial_plot(inspections, args.output)
    web_plot(flows, args.output)
    print(json.dumps({"throughTick": series[-1]["tick"], "checkpoints": len(checkpoints),
                      "lastPopulation": series[-1]["population"], "output": str(args.output)}))


if __name__ == "__main__":
    main()
