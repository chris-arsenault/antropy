"""Fit colony-local networks; export plain JSON consumed by the TypeScript runtime."""
import argparse
import hashlib
import json
import sqlite3
import subprocess
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn


class ColonyNetwork(nn.Module):
    def __init__(self, inputs, hidden, recurrent):
        super().__init__()
        self.input = nn.Linear(inputs, hidden)
        self.recurrence = nn.Linear(hidden, hidden, bias=False)
        self.decision = nn.Linear(hidden, hidden)
        self.output = nn.Linear(hidden, 10)
        self.recurrent = recurrent
        nn.init.zeros_(self.recurrence.weight)

    def forward(self, inputs, state=None):
        if state is None:
            state = torch.zeros((*inputs.shape[:-1], self.input.out_features))
        hidden = self.input(inputs)
        if self.recurrent:
            hidden = hidden + self.recurrence(state)
        state = torch.tanh(hidden)
        logits = self.output(torch.tanh(self.decision(state)))
        return logits, state


def read_data(paths):
    arrays, metadata = [], []
    for path in paths:
        meta = json.loads(Path(path + ".json").read_text())
        if meta.get("observationContract") != "colony-f32-v1":
            raise ValueError("dataset predates the matched float32 sensory contract; regenerate teacher labels")
        rows = np.fromfile(path + ".f32", dtype="<f4").reshape(-1, meta["columns"])
        if len(rows) != meta["rows"]:
            raise ValueError("dataset row count mismatch")
        arrays.append(rows)
        metadata.append(meta)
    return np.concatenate(arrays), metadata


def sequence_indices(rows, inputs, length):
    # Group by dataset-world/worker, then retain only physically consecutive frames.
    groups = {}
    for index, row in enumerate(rows):
        key = (int(row[inputs + 3]), int(row[inputs + 4]))
        groups.setdefault(key, []).append(index)
    sequences = []
    for indices in groups.values():
        for start in range(0, len(indices) - length + 1, length):
            part = indices[start:start + length]
            ticks = rows[part, inputs + 5]
            if np.all(np.diff(ticks) == 1):
                sequences.append(part)
    return torch.tensor(np.array(sequences), dtype=torch.long)


def loss_for(logits, targets, weights):
    motor = nn.functional.cross_entropy(logits[:, :8], targets[:, 0].long(), weight=weights)
    scent = nn.functional.binary_cross_entropy_with_logits(logits[:, 8:], targets[:, 1:3])
    return motor + 0.2 * scent


def fit(model, rows, args):
    inputs = model.input.in_features
    x = torch.from_numpy(rows[:, :inputs].copy())
    y = torch.from_numpy(rows[:, inputs:inputs + 3].copy())
    counts = torch.bincount(y[:, 0].long(), minlength=8).clamp_min(1)
    weights = (counts.max() / counts).sqrt().clamp_max(20)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.rate)
    sequences = sequence_indices(rows, inputs, 16) if args.recurrent else None
    losses = []
    for epoch in range(args.epochs):
        total = 0.0
        for _ in range(args.batches):
            optimizer.zero_grad()
            if sequences is None:
                indices = torch.randint(len(x), (1024,))
                logits, _ = model(x[indices])
                loss = loss_for(logits, y[indices], weights)
            else:
                indices = sequences[torch.randint(len(sequences), (64,))]
                state, loss = None, 0.0
                for step in range(indices.shape[1]):
                    logits, state = model(x[indices[:, step]], state)
                    loss = loss + loss_for(logits, y[indices[:, step]], weights) / indices.shape[1]
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5)
            optimizer.step()
            total += float(loss.detach())
        losses.append(total / args.batches)
        if (epoch + 1) % 10 == 0:
            print(json.dumps({"epoch": epoch + 1, "loss": losses[-1]}), flush=True)
    return losses


def export_model(model):
    def values(tensor):
        return tensor.detach().flatten().tolist()
    return {"version": 1, "inputs": model.input.in_features, "hidden": model.input.out_features,
            "recurrent": model.recurrent, "inputWeight": values(model.input.weight),
            "hiddenBias": values(model.input.bias), "recurrentWeight": values(model.recurrence.weight),
            "decisionWeight": values(model.decision.weight), "decisionBias": values(model.decision.bias),
            "outputWeight": values(model.output.weight), "outputBias": values(model.output.bias)}


def load_model(model, path):
    data = json.loads(Path(path).read_text())
    pairs = [(model.input.weight, "inputWeight"), (model.input.bias, "hiddenBias"),
             (model.recurrence.weight, "recurrentWeight"), (model.decision.weight, "decisionWeight"),
             (model.decision.bias, "decisionBias"), (model.output.weight, "outputWeight"),
             (model.output.bias, "outputBias")]
    with torch.no_grad():
        for tensor, key in pairs:
            tensor.copy_(torch.tensor(data[key]).reshape(tensor.shape))


def diagnose(model, rows):
    confusion = np.zeros((8, 8), dtype=np.int64)
    inputs = model.input.in_features
    with torch.no_grad():
        for start in range(0, len(rows), 4096):
            batch = rows[start:start + 4096]
            logits, _ = model(torch.from_numpy(batch[:, :inputs].copy()))
            predicted = logits[:, :8].argmax(1).numpy()
            np.add.at(confusion, (batch[:, inputs].astype(int), predicted), 1)
        examples, state = [], None
        for row in rows[:16]:
            x = torch.from_numpy(row[:inputs].copy()).unsqueeze(0)
            previous = state.clone() if state is not None else torch.zeros((1, model.input.out_features))
            logits, state = model(x, state)
            examples.append({"inputs": x[0].tolist(), "previous": previous[0].tolist(),
                             "logits": logits[0].tolist(), "state": state[0].tolist()})
    return {"zeroStateConfusion": confusion.tolist(), "parity": examples}


def record(args, metadata, report, model_hash, elapsed):
    git = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip() + "+dirty"
    settings = vars(args) | {"datasets": metadata, "modelHash": model_hash, "torch": torch.__version__,
                             "trainerHash": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    database = sqlite3.connect(Path(__file__).parent / "ledger.db")
    cursor = database.execute(
        "INSERT INTO runs (experiment,label,driver,seed,ticks,cadence,params,patches,git,started,wall_ms,ticks_per_sec,summary) "
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ("colony-network-training", args.output, "pytorch-cpu", args.seed, args.epochs, 0,
         json.dumps(settings), "[]", git, time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
         int(elapsed * 1000), args.epochs / elapsed, json.dumps(report)))
    database.commit()
    print("Recorded training", cursor.lastrowid, flush=True)
    database.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--initial")
    parser.add_argument("--recurrent", action="store_true")
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--hidden", type=int, default=64)
    parser.add_argument("--epochs", type=int, default=60)
    parser.add_argument("--batches", type=int, default=100)
    parser.add_argument("--rate", type=float, default=0.001)
    args = parser.parse_args()
    protected = {Path(path + suffix).resolve() for path in args.data for suffix in [".json", ".f32"]}
    if Path(args.output).resolve() in protected or Path(args.output + ".report.json").resolve() in protected:
        raise ValueError("model output must not overwrite a dataset artifact")
    torch.set_num_threads(3)
    torch.manual_seed(args.seed)
    started = time.monotonic()
    rows, metadata = read_data(args.data)
    model = ColonyNetwork(metadata[0]["inputs"], args.hidden, args.recurrent)
    if args.initial:
        load_model(model, args.initial)
    losses = fit(model, rows, args)
    artifact = json.dumps(export_model(model), separators=(",", ":"))
    Path(args.output).write_text(artifact)
    report = diagnose(model, rows) | {"losses": losses}
    Path(args.output + ".report.json").write_text(json.dumps(report))
    record(args, metadata, report, hashlib.sha256(artifact.encode()).hexdigest(), time.monotonic() - started)


if __name__ == "__main__":
    main()
