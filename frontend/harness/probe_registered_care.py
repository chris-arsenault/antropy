"""Offline feature probe on recorded decisions; this is not a deployed controller or survival score."""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn

from registered_artifacts import capture_sources, file_digest
from registered_network import RegisteredNetwork


def features(rows, model):
    hidden = torch.empty(len(rows), model.hidden)
    with torch.no_grad():
        for start in range(0, len(rows), 4096):
            part = rows[start:start + 4096]
            x = torch.from_numpy(part[:, :model.inputs].copy()).unsqueeze(1)
            state = torch.from_numpy(part[:, model.inputs:model.inputs + model.hidden].copy())
            _, hidden[start:start + len(part)] = model(x, state)
    # Existing receptors only: carrying, light, hunger, crop, and eight contact arrays.
    local = torch.from_numpy(rows[:, [20, 21, 81, 82, *range(33, 73)]].copy())
    return hidden, local


def labels(rows, model):
    offset = model.inputs + model.hidden
    motor = rows[:, offset].astype(int)
    write = rows[:, offset + 1].astype(int)
    current = rows[:, model.inputs - model.tasks:model.inputs].argmax(-1)
    role = np.where(write == 0, current, write - 1)
    care = np.isin(role, [2, 7]) | (motor >= 4)
    return torch.from_numpy(np.where(care, motor + 1, 0))


def evaluate(model, x, targets, indices):
    confusion = np.zeros((9, 9), dtype=np.int64)
    with torch.no_grad():
        for start in range(0, len(indices), 8192):
            batch = indices[start:start + 8192]
            actual = model(x[batch]).argmax(-1).numpy()
            np.add.at(confusion, (targets[batch].numpy(), actual), 1)
    return {"confusion": confusion.tolist(), "support": confusion.sum(1).tolist(),
            "recall": (confusion.diagonal() / confusion.sum(1).clip(1)).tolist(),
            "falseCareFraction": float(confusion[0, 1:].sum() / max(1, confusion[0].sum()))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--control", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--holdout", type=int, default=4)
    args = parser.parse_args()
    control = json.loads((args.control / "training.json").read_text())
    settings = control["settings"]
    args.output.mkdir(parents=True, exist_ok=False)
    sources = capture_sources(args.output)
    torch.set_num_threads(2)
    torch.manual_seed(17)
    actor = RegisteredNetwork(gated=settings["gated"], temperature=settings["temperature"])
    actor.load(settings["initial"])
    path = args.control / "stage-0.f32"
    if file_digest(path) != control["stages"][0]["dataHash"]:
        raise ValueError("control collection changed")
    rows = np.memmap(path, dtype="<f4", mode="r").reshape(-1, actor.inputs + actor.hidden + 7)
    hidden, local = features(rows, actor)
    target = labels(rows, actor)
    train = torch.from_numpy(np.flatnonzero(rows[:, -3] != args.holdout))
    test = torch.from_numpy(np.flatnonzero(rows[:, -3] == args.holdout))
    if not len(train) or not len(test):
        raise ValueError("probe requires both training and held-out training-world frames")
    groups = [train[target[train] == value] for value in range(9)]
    groups = [group for group in groups if len(group)]
    probes = {
        "hidden-linear": (nn.Linear(actor.hidden, 9), hidden),
        "hidden-nonlinear": (nn.Sequential(nn.Linear(actor.hidden, 32), nn.Tanh(), nn.Linear(32, 9)), hidden),
        "local-nonlinear": (nn.Sequential(nn.Linear(local.shape[1], 32), nn.Tanh(), nn.Linear(32, 9)), local),
    }
    optimizers = {name: torch.optim.Adam(model.parameters(), lr=0.001) for name, (model, _) in probes.items()}
    for _ in range(1200):
        batch = torch.cat([group[torch.randint(len(group), (64,))] for group in groups])
        for name, (model, x) in probes.items():
            optimizer = optimizers[name]
            optimizer.zero_grad()
            nn.functional.cross_entropy(model(x[batch]), target[batch]).backward()
            optimizer.step()
    report = {
        "control": str(args.control), "initialHash": settings["initialHash"], "dataHash": file_digest(path),
        "sourceHashes": sources, "holdoutTrainingCase": args.holdout, "trainRows": len(train), "testRows": len(test),
        "labels": ["no-local-care", "idle", "left", "right", "move", "pickup", "eat", "feed", "release"],
        "training": {"steps": 1200, "rate": 0.001, "seed": 17, "rowsPerPresentClass": 64},
        "results": {name: evaluate(model, x, target, test) for name, (model, x) in probes.items()},
    }
    (args.output / "report.json").write_text(json.dumps(report, indent=2))
    torch.save({name: model.state_dict() for name, (model, _) in probes.items()}, args.output / "probes.pt")
    print(json.dumps({"results": report["results"]}), flush=True)


if __name__ == "__main__":
    main()
