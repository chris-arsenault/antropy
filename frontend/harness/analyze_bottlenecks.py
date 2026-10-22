"""Reduce local zero-tick marginal reaction diagnostics without advancing a World."""
import argparse
import json
import statistics
from pathlib import Path


def reduce(path):
    data = json.loads(path.read_text())
    cells = data["cells"]
    candidates = []
    for cell in cells:
        net = cell["baseline"]["netReactionWork"]
        for slot, omitted in enumerate(cell["omitEnzyme"]):
            delta = omitted["netReactionWork"] - net
            if delta > 1e-12:
                candidates.append({"id": cell["id"], "slot": slot, "gain": delta,
                                   "baseline": net, "omitted": omitted["netReactionWork"],
                                   "energy": cell["energy"], "mass": cell["mass"],
                                   "effort": cell["action"]["activity"][slot]})
    candidates.sort(key=lambda row: (-row["gain"], row["id"], row["slot"]))
    rich = [c for c in cells if c["energy"] >= 0.9 * c["energyCapacity"]]
    growing = [c for c in cells if c["mass"] < c["targetMass"] - 1e-10]
    imported = [sum(c["chemicalFlows"]["imported"]) for c in cells]
    source = data["config"]["sourceSpecies"]
    nonseed = sum(sum(q for s, q in enumerate(c["chemicalFlows"]["imported"])
                      if s not in source) for c in cells)
    return {"input": str(path), "tick": data["tick"], "population": len(cells),
            "biomass": sum(c["mass"] for c in cells),
            "medianGeneration": statistics.median(c["generation"] for c in cells),
            "rich": len(rich), "belowTargetMass": len(growing),
            "richMaterialBlocked": sum(c["material"] <= c["protected"] for c in rich),
            "materialBlocked": sum(c["material"] <= c["protected"] for c in growing),
            "richAtTargetMass": sum(c["mass"] >= c["targetMass"] - 1e-10 for c in rich),
            "richDivisionMaterialBlocked": sum(c["material"] < c["divisionRequirements"][0]
                                               for c in rich),
            "richDivisionWorkBlocked": sum(c["energy"] < c["divisionRequirements"][1]
                                           for c in rich),
            "negativeReactionCells": sum(c["baseline"]["netReactionWork"] < 0 for c in cells),
            "reactionNet": sum(c["baseline"]["netReactionWork"] for c in cells),
            "reactionGross": sum(c["baseline"]["grossCaptured"] for c in cells),
            "importedLifetimeLivingCells": sum(imported),
            "nonseedImportedLifetimeLivingCells": nonseed,
            "beneficialOmissionCells": len({c["id"] for c in candidates}),
            "topOmissions": candidates[:12]}


def counterfactual(path):
    rows = [json.loads(p.read_text()) for p in sorted(path.glob("*/result.json"))]
    common = set.intersection(*(set(s["tick"] for s in r["samples"] if s["population"])
                                for r in rows))
    tick = max(common)
    result = []
    for row in rows:
        sample = next(s for s in row["samples"] if s["tick"] == tick)
        flows = sample["ledger"]["flows"]
        expenses = sum(flows[k] for k in ("maintenance", "motors", "learning", "transport",
                                          "repair", "growth", "coverWork", "emission", "speechWork"))
        initial = row["samples"][0]["energy"]
        # These registered cohorts have no divisions or damage deaths before the common sample.
        if sample["population"] != 1 or sample["ledger"]["divisionHeat"]:
            raise ValueError("Usable-work reduction requires an uninterrupted single cell")
        uphill = flows["captured"] - expenses - (sample["energy"] - initial)
        uphill -= sample["ledger"]["overflowHeat"]
        result.append({"arm": row["arm"], "focal": row["focal"],
                       "seconds": row["modelSeconds"], "reason": row["reason"],
                       "ending": row["ending"], "final": {k: row["final"][k] for k in
                            ("population", "mass", "energy", "netBiomass", "netFundedWork")},
                       "common": {"seconds": (tick-row["start"])*row["modelSeconds"]/(row["end"]-row["start"]),
                                  "grossCaptured": flows["captured"], "uphill": uphill,
                                  "expenses": expenses, "reserve": sample["energy"],
                                  "netFundedWork": sample["netFundedWork"]}})
    return {"input": str(path), "rows": result}


def plot(cases, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(1, 2, figsize=(11, 4), constrained_layout=True)
    names = {"reference": ("Original cell", "#777777"),
             "silenced": ("Whole enzyme silenced", "#c77620"),
             "key": ("One recognition weight changed", "#167b65")}
    for axis, selected in zip(axes, ((cases[0],), (cases[1], cases[2]))):
        seen = set()
        for case in selected:
            for path in sorted(case.glob("*/result.json")):
                data = json.loads(path.read_text())
                if data["arm"] in seen:
                    continue
                seen.add(data["arm"])
                dt = data["modelSeconds"]/(data["end"]-data["start"])
                label, color = names[data["arm"]]
                axis.plot([(s["tick"]-data["start"])*dt for s in data["samples"]],
                          [s["energy"] for s in data["samples"]], color=color, label=label,
                          linewidth=2)
                if data["reason"] == "cohort extinction":
                    axis.scatter([data["modelSeconds"]], [0], marker="x", color=color, zorder=3)
        axis.set(xlabel="Model seconds", ylabel="Retained usable work", xlim=(0, 82), ylim=(0, None))
        axis.grid(alpha=0.2)
        axis.legend(fontsize=8)
    axes[0].set_title("Cell 19751512: an avoidable uphill sink")
    axes[1].set_title("Cell 19753422: selective chemistry beats shutdown")
    fig.savefig(output, dpi=160)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--cases", nargs="*", type=Path, default=[])
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--plot", type=Path)
    args = parser.parse_args()
    root = (Path(__file__).parent / "artifacts").resolve()
    if not args.output.resolve().is_relative_to(root):
        parser.error("Generated experimental data must stay under harness/artifacts")
    if args.plot and (not args.plot.resolve().is_relative_to(root) or len(args.cases) != 3):
        parser.error("The local comparison plot requires the three registered case directories")
    result = {"censuses": [reduce(path) for path in args.inputs],
              "counterfactuals": [counterfactual(path) for path in args.cases]}
    with args.output.open("x") as file:
        json.dump(result, file, indent=2)
        file.write("\n")
    if args.plot:
        if args.plot.exists():
            raise FileExistsError(args.plot)
        plot(args.cases, args.plot)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
