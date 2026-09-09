"""Demonstration initialization and DAgger diagnostics, never a survival fitness measure."""
import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn

from registered_network import RegisteredNetwork
from train_registered import save, record, close_worker
from registered_artifacts import capture_sources, file_digest
from registered_demonstrations import Demonstrations, weights_for, stage_datasets


def fit(model, datasets, optimizer, args):
    fraction = args.care_replay_fraction
    priorities = [data.prepare_priorities(model) for data in datasets] if fraction else []
    weights, counts = weights_for(datasets, "motor_counts", 20)
    task_weights, task_counts = weights_for(datasets, "task_counts", 10)
    losses = []
    for _ in range(args.epochs):
        total = 0.0
        for _ in range(args.batches):
            dataset = datasets[int(torch.randint(len(datasets), ()))]
            x, state, targets = dataset.batch(fraction)
            logits, _ = model(x, state)
            logits = logits.flatten(0, 1)
            loss = nn.functional.cross_entropy(logits[:, :8], targets[:, 0].long(), weight=weights)
            loss = loss + 0.3 * nn.functional.cross_entropy(logits[:, 10:], targets[:, 1].long(), weight=task_weights)
            loss = loss + 0.2 * nn.functional.binary_cross_entropy_with_logits(logits[:, 8:10], targets[:, 2:4])
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5)
            optimizer.step()
            total += float(loss.detach())
        losses.append(total / args.batches)
    return {"losses": losses, "motorCounts": counts.tolist(), "taskCounts": task_counts.tolist(),
            "careReplayFraction": fraction, "careReplayBuckets": priorities}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--initial", required=True)
    parser.add_argument("--gated", action="store_true")
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--worlds", required=True)
    parser.add_argument("--assistance", default="1,0.75,0.5,0.25,0")
    parser.add_argument("--ticks", type=int, default=8000)
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batches", type=int, default=40)
    parser.add_argument("--rate", type=float, default=0.0005)
    parser.add_argument("--temperature", type=float, default=0)
    parser.add_argument("--care-replay-fraction", type=float, default=0)
    parser.add_argument("--replay", nargs="*", default=[])
    parser.add_argument("--stage-data", choices=("all", "latest"), default="all")
    args = parser.parse_args()
    if not 0 <= args.care_replay_fraction <= 1:
        raise ValueError("care replay fraction must be between zero and one")
    args.worldCases = json.loads(Path(args.worlds).read_text())
    args.worldsHash = hashlib.sha256(Path(args.worlds).read_bytes()).hexdigest()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=False)
    args.sourceHashes = capture_sources(output)
    args.initialHash = hashlib.sha256(Path(args.initial).read_bytes()).hexdigest()
    args.replayHashes = {path: file_digest(path) for path in args.replay}
    torch.set_num_threads(2)
    torch.manual_seed(args.seed)
    model = RegisteredNetwork(gated=args.gated, temperature=args.temperature)
    model.load(args.initial)
    retained = [Demonstrations(path, model) for path in args.replay]
    collected = []
    optimizer = torch.optim.Adam(model.parameters(), lr=args.rate)
    current = output / "current.json"
    save(model, current)
    started, report = time.monotonic(), []
    worker = subprocess.Popen(["pnpm", "exec", "tsx", "harness/registeredTeachingWorker.ts"],
                              stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, start_new_session=True)
    try:
        for index, assistance in enumerate(map(float, args.assistance.split(','))):
            path = output / f"stage-{index}.f32"
            request = {"model": str(current), "output": str(path), "ticks": args.ticks,
                       "worlds": args.worldCases, "assistance": assistance}
            worker.stdin.write(json.dumps(request) + "\n")
            worker.stdin.flush()
            line = worker.stdout.readline()
            if not line:
                raise RuntimeError(f"teaching worker exited: {worker.poll()}")
            metadata = json.loads(line)
            rows = np.memmap(path, dtype="<f4", mode="r").reshape(-1, metadata["columns"])
            if len(rows) != metadata["rows"]:
                raise ValueError("truncated teaching collection")
            collected.append(Demonstrations(path, model))
            datasets = stage_datasets(retained, collected, args.stage_data)
            metrics = fit(model, datasets, optimizer, args)
            save(model, current)
            save(model, output / f"stage-{index + 1}.json", rows)
            fitted = [{"path": data.path, "hash": file_digest(data.path), "rows": len(data.rows)}
                      for data in datasets]
            entry = {"stage": index + 1, "dataHash": file_digest(path), "fitDatasets": fitted,
                     **metadata, **metrics}
            report.append(entry)
            (output / "training.json").write_text(json.dumps({"settings": vars(args), "stages": report}))
            print(json.dumps({key: value for key, value in entry.items() if key != "tasks"}), flush=True)
    finally:
        close_worker(worker)
    args.iterations = len(report)
    record(args, {"stages": report}, time.monotonic() - started, method="demonstration-dagger")


if __name__ == "__main__":
    main()
