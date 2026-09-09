"""Generate the measured study summary and preserve exact current source files."""
import hashlib
import json
import sys
from pathlib import Path

from registered_artifacts import capture_sources


def late_windows(row):
    series = row["series"]
    lifespan = row["world"]["config"]["workerLifespan"]
    final = series[-1]
    late = [point for point in series if point["tick"] >= final["tick"] - lifespan]
    middle = next((point for point in late if point["tick"] >= final["tick"] - lifespan / 2), final)
    return [{"from": a["tick"], "to": b["tick"],
             **{key: b[key] - a[key] for key in ("births", "queenFed", "broodFed")}}
            for a, b in ((late[0], middle), (middle, final))]


def summarize(root):
    evaluations = []
    for path in sorted([*root.glob("validation-*.json"), *root.glob("test-*.json")]):
        data = json.loads(path.read_text())
        if "results" not in data:
            continue
        evaluations.append({
            "file": path.name, "complete": data["complete"],
            "physics": data["params"]["physics"], "modelHash": data["params"]["modelHash"],
            "viable": sum(row["viable"] for row in data["results"]),
            "worlds": len(data["results"]),
            "maximumEnergyResidual": max(abs(point["residual"]) for row in data["results"] for point in row["series"]),
            "cases": [{"label": row["world"]["label"], "ledger": row["id"], "viable": row["viable"],
                       "queenAlive": row["final"]["queenAlive"], "queenReserve": row["final"]["queenReserve"],
                       "workers": row["final"]["workers"], "births": row["final"]["births"],
                       "continued": row["continued"], "lateWindowGains": late_windows(row),
                       "score": row["score"]} for row in data["results"]],
        })
    training = []
    for path in sorted(root.glob("ppo-*/training.json")):
        data = json.loads(path.read_text())
        training.append({
            "arm": path.parent.name, "updates": len(data["iterations"]),
            "actorDecisions": sum(entry["rows"] for entry in data["iterations"]),
            "worldTicks": sum(row["final"]["tick"] - row["start"]["tick"]
                              for entry in data["iterations"] for row in entry["outcomes"]),
            "maximumLikelihoodError": max(entry["likelihoodParity"] for entry in data["iterations"]),
            "emptyWorkerEndpoints": [row["final"] for entry in data["iterations"]
                                     for row in entry["outcomes"] if row["final"]["workers"] == 0],
        })
    source_hashes = capture_sources(root)
    demonstrations = []
    for path in sorted(root.glob("*/training.json")):
        data = json.loads(path.read_text())
        if "stages" not in data:
            continue
        demonstrations.append({
            "arm": path.parent.name, "initial": data["settings"]["initial"],
            "initialHash": data["settings"]["initialHash"],
            "worldsHash": data["settings"]["worldsHash"],
            "retained": data["settings"]["replay"],
            "collectedActorDecisions": sum(stage["rows"] for stage in data["stages"]),
            "stages": [{"stage": stage["stage"], "assistance": stage["assistance"],
                        "rows": stage["rows"], "preUpdateOutcomes": stage["outcomes"]}
                       for stage in data["stages"]],
        })
    paired_fits = [{"arm": path.parent.name, **json.loads(path.read_text())}
                   for path in sorted(root.glob("*/replay-fit.json"))]
    summary = {"evaluations": evaluations, "training": training, "pairedFits": paired_fits,
               "demonstrations": demonstrations, "sourceHashes": source_hashes}
    selection = root / "selection.json"
    if selection.exists():
        summary["selection"] = json.loads(selection.read_text())
        summary["selectedFileHash"] = hashlib.sha256((root / "selected-model.json").read_bytes()).hexdigest()
    (root / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps({"evaluations": len(evaluations), "training": training}))


if __name__ == "__main__":
    summarize(Path(sys.argv[1]))
