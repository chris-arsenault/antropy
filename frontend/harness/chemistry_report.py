"""Local schema-v2 evidence reports. Reads saved data; never advances a simulation.

Historical readers dispatch here only when every selected run is chemical schema v2.
Raw typed flows and source identities remain in the report alongside derived ratios.
"""
import base64
import hashlib
import json
from pathlib import Path
import statistics
import struct


def read(path):
    return json.loads(Path(path).read_text())


def percent(numerator, denominator):
    return 100 * numerator / denominator if denominator else None


def current_cases(root):
    paths = sorted(p for p in Path(root).rglob("manifest.json")
                   if (p.parent / "result.json").exists())
    versions = {read(p).get("schemaVersion", 1) for p in paths}
    if 2 in versions and versions != {2}:
        raise ValueError("Separate historical and current chemistry evidence roots")
    return paths if versions == {2} else []


def field_material(checkpoint):
    """Decode the actual v9 little-endian float64 blocks, including edge padding."""
    if checkpoint["version"] != 9:
        raise ValueError("Current field plots require checkpoint v9")
    import numpy as np
    width, height = (checkpoint["config"][key] for key in ("width", "height"))
    values = np.zeros((height, width))
    columns = (width + 7) // 8
    for key, encoded in checkpoint["chemicals"]:
        tile = key // 256
        x, y = (tile % columns) * 8, (tile // columns) * 8
        block = struct.unpack("<64d", base64.b64decode(encoded, validate=True))
        for offset, q in enumerate(block):
            px, py = x + offset % 8, y + offset // 8
            if px < width and py < height:
                values[py, px] += q
    return values


def quick_row(manifest, result):
    from rps_report import frequencies
    units = manifest["flowUnits"]
    groups = []
    for group in result["groups"]:
        flows = group["flows"]
        expense = sum(amount for key, amount in flows.items() if units[key] == "energy")
        groups.append({**group, "energyFlowsTotal": expense,
                       "motorShareOfEnergyFlowsPercent": percent(flows.get("motors", 0), expense),
                       "repairShareOfEnergyFlowsPercent": percent(flows.get("repair", 0), expense),
                       "constructionPerImportedMaterialPercent":
                           percent(flows.get("constructed", 0), flows.get("imported", 0))})
    return {"kind": "constructed opportunity", "ticks": result["ticks"],
            "stop": result["stop"], "completed": result["completed"],
            "frequencies": frequencies(groups), "groups": groups,
            "energyResidualPercent": result["maxEnergyResidualPercent"],
            "materialResidualPercent": result["maxMaterialResidualPercent"],
            "flowUnits": units, "conditions": manifest["specification"],
            "ratios": "Imported material and potential include recycling. Construction may use initial reserves. Energy-flow totals include reaction heat; they are not net captured energy."}


def ledger_window(observations, start, end):
    a = next((p for p in observations if p["tick"] == start), None)
    b = next((p for p in observations if p["tick"] == end), None)
    if a is None or b is None:
        return None
    return {key: b["ledger"][key] - value for key, value in a["ledger"].items()}


def population_row(manifest, result):
    final, series = result["final"], result["series"]
    observations = result.get("observations", [])
    phase = manifest["config"].get("sourceEpochs", {}).get("phaseTicks", manifest["ticks"])
    windows = []
    for start in range(0, manifest["ticks"], phase):
        end = min(start + phase, manifest["ticks"])
        samples = [p for p in series if start < p["tick"] <= end]
        windows.append({"ticks": [start, end], "complete": final["tick"] >= end,
                        "sampleCount": len(samples), "meanSampledPopulation":
                            statistics.mean(p["population"] for p in samples) if samples else None,
                        "ledgerDelta": ledger_window(observations, start, end)})
    return {"kind": "population observation", "ticks": final["tick"],
            "stop": result["stop"], "completed": result["completed"],
            "final": final, "windows": windows,
            "finalObservation": observations[-1] if observations else None,
            "cohorts": result.get("cohorts"),
            "interpretation": "Population size and inherited differences are descriptive; neither establishes adaptation or coexistence."}


def paired_populations(cases):
    pairs = []
    seeds = sorted({m["seed"] for _, m, _ in cases if "frozen" in m})
    for seed in seeds:
        arms = {m["frozen"]: (p, m, r) for p, m, r in cases
                if m.get("seed") == seed and "frozen" in m}
        if set(arms) != {False, True}:
            continue
        initial = [read(arms[arm][0].parent / "initial.json") for arm in (False, True)]
        configs = [i.pop("config") for i in initial]
        for i in initial:
            i.pop("provenance", None)
            i.pop("exportSource", None)
        samples = [{p["tick"]: p for p in arms[arm][2]["series"]} for arm in (False, True)]
        ticks = sorted(samples[0].keys() & samples[1].keys())
        pairs.append({"seed": seed, "identicalPhysicalStartExceptConfig": initial[0] == initial[1],
                      "configurationDifferences": {k: [v, configs[1][k]] for k, v in configs[0].items()
                                                   if v != configs[1][k]},
                      "matchedSamples": [{"tick": tick,
                                          "livePopulation": samples[0][tick]["population"],
                                          "frozenPopulation": samples[1][tick]["population"],
                                          "suppliedMatterDifference": samples[0][tick]["supplied"] - samples[1][tick]["supplied"],
                                          "suppliedPotentialDifference": samples[0][tick]["suppliedEnergy"] - samples[1][tick]["suppliedEnergy"]}
                                         for tick in ticks]})
    return pairs


def plot_cases(root, category, cases):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
    figure, axes = plt.subplots(len(cases), 2, figsize=(12, 3.5 * len(cases)), squeeze=False)
    for (left, right), (path, manifest, result) in zip(axes, cases):
        traces = path.parent / "traces.json"
        if traces.exists():
            frames = read(traces)
            initial = read(path.parent / "initial.json")
            width, height = initial["config"]["width"], initial["config"]["height"]
            left.imshow(field_material(initial), origin="lower", cmap="Greys")
            for founder in frames[0]["cells"]:
                points = [(c["x"], c["y"]) for f in frames for c in f["cells"] if c["id"] == founder["id"]]
                line = np.asarray(points, dtype=float)
                if len(line) > 1:
                    seams = np.any(np.abs(np.diff(line, axis=0)) > [width / 2, height / 2], axis=1)
                    line[1:][seams] = np.nan
                left.plot(line[:, 0], line[:, 1], linewidth=1)
            for group in result["groups"]:
                counts = [sum(c["group"] == group["genome"] for c in f["cells"]) for f in frames]
                right.plot([f["tick"] for f in frames], counts, label=str(group["genome"]))
            left.set_title("Initial total chemical material; founder paths")
        else:
            series = result["series"]
            left.plot([p["tick"] for p in series], [p["population"] for p in series])
            left.set(ylabel="Living cells", xlabel="Tick")
            for key in ("energyResidualPercent", "materialResidualPercent"):
                right.plot([p["tick"] for p in series], [p[key] for p in series], label=key)
        right.set(title=path.parent.name, xlabel="Tick")
        right.legend(fontsize=7)
    figure.tight_layout()
    figure.savefig(root / f"{category}-chemistry.png", dpi=140)
    plt.close(figure)


def dispatch(root, category):
    """Return False only for entirely historical evidence; mixed schemas fail explicitly."""
    from numerical_report import dispatch as numerical
    if numerical(root, category):
        return True
    root = Path(root)
    paths = current_cases(root)
    if not paths:
        return False
    cases, rows = [], []
    for path in paths:
        manifest, result = read(path), read(path.parent / "result.json")
        if "groups" not in result and "series" not in result:
            raise ValueError(f"Unsupported current evidence shape: {path}")
        cases.append((path, manifest, result))
        row = quick_row(manifest, result) if "groups" in result else population_row(manifest, result)
        rows.append({"directory": str(path.parent), "schemaVersion": 2,
                     "manifestSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                     "sourceDigest": manifest["sourceDigest"],
                     "sourceDigestAfter": result.get("sourceDigestAfter", manifest.get("sourceDigestAfter")),
                     "config": manifest["config"], "wallMs": result["wallMs"], **row})
    payload = {"schemaVersion": 2, "analysisSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
               "rows": rows, "pairs": paired_populations(cases)}
    (root / f"{category}-chemistry.json").write_text(json.dumps(payload, indent=2, allow_nan=False))
    plot_cases(root, category, cases)
    print(json.dumps({"runs": len(rows), "output": str(root / f"{category}-chemistry.json")}))
    return True
