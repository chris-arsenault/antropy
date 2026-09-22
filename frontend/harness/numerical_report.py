"""Read versioned WASM evidence locally. No simulation execution or checkpoint decoding.

Binary checkpoints and their archived engine are reconstruction inputs. Reports use
the explicit observations captured by that engine, including negative/incomplete runs.
"""
import hashlib
import json
from pathlib import Path

ENERGY = ("maintenance", "motors", "learning", "transport", "reactionHeat", "construction", "repair")


def read(path):
    return json.loads(Path(path).read_text())


def percentage(a, b):
    return 100 * a / b if b else None


def jsonlines(path):
    if not path.exists():
        return []
    with path.open() as stream:
        return [json.loads(line) for line in stream if line.strip()]


def delta(a, b):
    return {key: delta(value, b[key]) if isinstance(value, dict) else b[key] - value
            for key, value in a.items()}


def quick(manifest, result):
    groups = []
    for group in result["groups"]:
        f = group["flows"]
        expense = sum(f.get(key, 0) for key in ENERGY)
        groups.append({**group, "dissipatedEnergy": expense,
                       "motorPercentDissipated": percentage(f["motors"], expense),
                       "repairPercentDissipated": percentage(f["repair"], expense),
                       "constructionPercentImported": percentage(f["constructed"], f["imported"])})
    total = sum(g["living"] for g in groups)
    return {"kind": "constructed opportunity", "tick": result["ticks"],
            "completed": result["completed"], "stop": result["stop"], "groups": groups,
            "livingSharesPercent": {str(g["genome"]): percentage(g["living"], total) for g in groups},
            "energyResidualPercent": result["maxEnergyResidualPercent"],
            "materialResidualPercent": result["maxMaterialResidualPercent"],
            "conditions": manifest["specification"],
            "denominators": "Flows include recycling and initial reserves. Zero denominators are null. Chemical transformations measure material; captured and dissipated energy are separate."}


def population(path, manifest, result):
    points = jsonlines(path.parent / "samples.jsonl")
    series = result["series"]
    first, final = series[0], result["final"]
    phase = (manifest["config"].get("sourceEpochs") or {}).get("phaseTicks", manifest["ticks"])
    windows = []
    for start in range(first["tick"], manifest["ticks"], phase):
        end = min(start + phase, manifest["ticks"])
        a = next((p for p in series if p["tick"] == start), None)
        b = next((p for p in series if p["tick"] == end), None)
        windows.append({"ticks": [start, end], "complete": final["tick"] >= end,
                        "ledgerDelta": delta(a["ledger"], b["ledger"]) if a and b else None})
    return {"kind": "population observation", "tick": final["tick"],
            "completed": result["completed"], "stop": result["stop"], "final": final,
            "windows": windows, "finalObservation": points[-1] if points else None,
            "cohortSamples": [{"tick": p["tick"], "cohorts": p["cohorts"]}
                              for p in points if "cohorts" in p],
            "maxEnergyResidual": result["maxResidual"],
            "maxMaterialResidual": result["maxMaterialResidual"]}


def pairs(cases):
    result = []
    seeds = sorted({m["seed"] for _, m, _ in cases if "frozen" in m})
    for seed in seeds:
        arms = {m["frozen"]: (p, m, r) for p, m, r in cases
                if m.get("seed") == seed and "frozen" in m}
        if set(arms) != {False, True}:
            continue
        configs = [arms[arm][1]["config"] for arm in (False, True)]
        samples = [{p["tick"]: p for p in arms[arm][2]["series"]} for arm in (False, True)]
        result.append({"seed": seed,
                       "configurationDifferences": {k: [v, configs[1][k]] for k, v in configs[0].items() if v != configs[1][k]},
                       "initialCheckpoints": [str(arms[arm][0].parent / "initial.bin") for arm in (False, True)],
                       "physicalStartEquality": "Not inferred from binary inequality; policy configuration is encoded in checkpoints",
                       "matchedSamples": [{"tick": tick, "livePopulation": samples[0][tick]["population"],
                                            "frozenPopulation": samples[1][tick]["population"],
                                            "suppliedMatterDifference": samples[0][tick]["ledger"]["supplied"] - samples[1][tick]["ledger"]["supplied"],
                                            "suppliedPotentialDifference": samples[0][tick]["ledger"]["suppliedEnergy"] - samples[1][tick]["ledger"]["suppliedEnergy"]}
                                           for tick in sorted(samples[0].keys() & samples[1].keys())]})
    return result


def plots(root, category, cases):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
    figure, axes = plt.subplots(len(cases), 2, figsize=(12, 3.5 * len(cases)), squeeze=False)
    for (left, right), (path, manifest, result) in zip(axes, cases):
        traces = path.parent / "traces.json"
        if traces.exists():
            frames = read(traces)
            width, height = (manifest["config"][k] for k in ("width", "height"))
            field = read(path.parent / "initial-field.json")
            left.imshow(np.asarray(field["values"]).reshape(field["ny"], field["nx"]),
                        origin="lower", extent=(0, width, 0, height), cmap="Greys")
            for founder in frames[0]["cells"]:
                line = np.array([(c["x"], c["y"]) for f in frames for c in f["cells"] if c["id"] == founder["id"]], dtype=float)
                if len(line) > 1:
                    seams = np.any(np.abs(np.diff(line, axis=0)) > [width / 2, height / 2], axis=1)
                    line[1:][seams] = np.nan
                left.plot(line[:, 0], line[:, 1], linewidth=1)
            for group in result["groups"]:
                counts = [sum(c["group"] == group["genome"] for c in f["cells"]) for f in frames]
                right.plot([f["tick"] for f in frames], counts, label=str(group["genome"]))
            left.set(title="Initial chemical material and founder paths", xlim=(0, width), ylim=(0, height))
        else:
            series = result["series"]
            left.plot([p["tick"] for p in series], [p["population"] for p in series])
            left.set(ylabel="Living cells", xlabel="Tick")
            for key in ("energyResidual", "materialResidual"):
                right.plot([p["tick"] for p in series], [p[key] for p in series], label=key)
            right.set_ylabel("Accounting balance error (native units)")
        right.set(title=path.parent.name, xlabel="Tick")
        right.legend(fontsize=7)
    figure.tight_layout()
    figure.savefig(root / f"{category}-chemistry.png", dpi=140)
    plt.close(figure)


def dispatch(root, category):
    root = Path(root)
    paths = sorted(p for p in root.rglob("manifest.json") if (p.parent / "result.json").exists())
    versions = {read(p).get("schemaVersion", 1) for p in paths}
    if 3 not in versions:
        return False
    if versions != {3}:
        raise ValueError("Separate evidence roots are required for different physical schemas")
    cases, rows = [], []
    for path in paths:
        manifest, result = read(path), read(path.parent / "result.json")
        if "groups" not in result and "series" not in result:
            raise ValueError(f"Use study_sql.py for study tables; unsupported report shape: {path}")
        row = quick(manifest, result) if "groups" in result else population(path, manifest, result)
        rows.append({"directory": str(path.parent), "manifest": manifest,
                     "manifestSha256": hashlib.sha256(path.read_bytes()).hexdigest(), **row})
        cases.append((path, manifest, result))
    payload = {"schemaVersion": 3, "analysisSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               "interpretation": "Constructed opportunities and sampled inherited differences do not establish evolved adaptation, coexistence or long-term endurance.",
               "rows": rows, "pairs": pairs(cases)}
    target = root / f"{category}-chemistry.json"
    target.write_text(json.dumps(payload, indent=2, allow_nan=False))
    plots(root, category, cases)
    print(json.dumps({"runs": len(rows), "output": str(target)}))
    return True
