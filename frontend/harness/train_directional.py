"""Bounded directional colony imitation; no optimization executes in the living world."""
import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn

from directional_network import DirectionalNetwork, read_directional_data, samples
from train_colony import loss_for, record, sequence_indices


def fit(model, rows, args):
    x = torch.from_numpy(rows[:, :model.inputs].copy())
    y = torch.from_numpy(rows[:, model.inputs:model.inputs + 3].copy())
    sequences = sequence_indices(rows, model.inputs, 16)
    if len(sequences) == 0:
        raise ValueError("no consecutive worker sequences")
    counts = torch.bincount(y[:, 0].long(), minlength=8).clamp_min(1)
    weights = (counts.max() / counts).sqrt().clamp_max(20)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.rate)
    losses = []
    for epoch in range(args.epochs):
        total = 0.0
        for _ in range(args.batches):
            indices = sequences[torch.randint(len(sequences), (64,))]
            optimizer.zero_grad()
            logits, _ = model(x[indices])
            loss = loss_for(logits.reshape(-1, 10), y[indices].reshape(-1, 3), weights)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5)
            optimizer.step()
            total += float(loss.detach())
        losses.append(total / args.batches)
        if (epoch + 1) % 10 == 0:
            print(json.dumps({"epoch": epoch + 1, "loss": losses[-1]}), flush=True)
    return losses


def diagnose(model, rows):
    confusion = np.zeros((8, 8), dtype=np.int64)
    x = torch.from_numpy(rows[:, :model.inputs].copy())
    sequences = sequence_indices(rows, model.inputs, 16)
    with torch.no_grad():
        for start in range(0, len(sequences), 256):
            indices = sequences[start:start + 256]
            logits, _ = model(x[indices])
            predicted = logits[..., :8].argmax(-1).flatten().numpy()
            labels = rows[indices.numpy(), model.inputs].astype(int).flatten()
            np.add.at(confusion, (labels, predicted), 1)
        examples, state = [], torch.zeros(1, model.hidden)
        for index in sequences[0]:
            inputs = x[index].reshape(1, 1, -1)
            previous = state.clone()
            logits, state = model(inputs, state)
            history = inputs[0, 0, 111:].tolist()
            examples.append({"inputs": inputs[0, 0].tolist(),
                             "previous": previous[0].tolist() + history,
                             "logits": logits[0, 0].tolist(),
                             "state": state[0].tolist() + history,
                             "directions": samples(inputs)[0, 0].tolist()})
    return {"sequenceConfusion": confusion.tolist(), "parity": examples}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--initial")
    parser.add_argument("--history", type=int, choices=[0, 4], default=0)
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batches", type=int, default=100)
    parser.add_argument("--rate", type=float, default=0.001)
    args = parser.parse_args()
    protected = {Path(path + suffix).resolve() for path in args.data for suffix in [".json", ".f32"]}
    if any(Path(args.output + suffix).resolve() in protected for suffix in ["", ".report.json"]):
        raise ValueError("model output must not overwrite a dataset artifact")
    torch.set_num_threads(3)
    torch.manual_seed(args.seed)
    started = time.monotonic()
    rows, metadata = read_directional_data(args.data, args.history)
    model = DirectionalNetwork(args.history)
    if args.initial:
        model.load(args.initial)
    losses = fit(model, rows, args)
    artifact = json.dumps(model.export(), separators=(",", ":"))
    Path(args.output).write_text(artifact)
    report = diagnose(model, rows) | {"losses": losses, "rows": len(rows),
        "sources": {name: hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest()
                    for name in ["train_directional.py", "directional_network.py", "train_colony.py"]}}
    Path(args.output + ".report.json").write_text(json.dumps(report))
    record(args, metadata, report, hashlib.sha256(artifact.encode()).hexdigest(), time.monotonic() - started)


if __name__ == "__main__":
    main()
