"""Outcome learning on the TypeScript world; no teacher loss or scripted task manager."""
import argparse
import hashlib
import json
import os
import signal
import sqlite3
import subprocess
import time
from pathlib import Path

import numpy as np
import torch

from registered_network import RegisteredNetwork, parity
from registered_ppo import Critic, update
from registered_artifacts import capture_sources


def save(model, path, rows=None):
    path.write_text(json.dumps(model.export(), separators=(",", ":")))
    if rows is not None:
        Path(str(path) + ".report.json").write_text(json.dumps({"parity": parity(model, rows)}))


def record(args, report, elapsed, method="recurrent-ppo"):
    git = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip() + "+dirty"
    params = vars(args) | {"torch": torch.__version__}
    with sqlite3.connect(Path(__file__).parent / "ledger.db", timeout=30) as database:
        cursor = database.execute(
            "INSERT INTO runs (experiment,label,driver,seed,ticks,cadence,params,patches,git,started,wall_ms,ticks_per_sec,summary) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ("registered-controller-training", args.output, method, args.seed, args.iterations * args.ticks, 0,
             json.dumps(params), "[]", git, time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
             int(elapsed * 1000), args.iterations * args.ticks / max(elapsed, 0.001), json.dumps(report)))
        print(json.dumps({"ledger": cursor.lastrowid}), flush=True)


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--initial")
    parser.add_argument("--tasks", type=int, default=8)
    parser.add_argument("--gated", action="store_true")
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--worlds", required=True, help="JSON array of explicit world cases and full configs")
    parser.add_argument("--iterations", type=int, default=12)
    parser.add_argument("--ticks", type=int, default=2048)
    parser.add_argument("--warmup", type=int, default=0)
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch", type=int, default=64)
    parser.add_argument("--sequence", type=int, default=32)
    parser.add_argument("--rate", type=float, default=0.0001)
    parser.add_argument("--entropy", type=float, default=0.005)
    parser.add_argument("--gamma", type=float, default=0.9995)
    parser.add_argument("--trace", type=float, default=0.999)
    return parser.parse_args()


def close_worker(worker):
    worker.stdin.close()
    try:
        worker.wait(timeout=10)
    except subprocess.TimeoutExpired:
        os.killpg(worker.pid, signal.SIGTERM)
        worker.wait(timeout=10)


def main():
    args = arguments()
    args.worldCases = json.loads(Path(args.worlds).read_text())
    args.worldsHash = hashlib.sha256(Path(args.worlds).read_bytes()).hexdigest()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=False)
    args.sourceHashes = capture_sources(output)
    args.rewardProtocol = "registered-physical-reward-v2"
    args.initialHash = hashlib.sha256(Path(args.initial).read_bytes()).hexdigest() if args.initial else None
    torch.set_num_threads(2)
    torch.manual_seed(args.seed)
    model = RegisteredNetwork(tasks=args.tasks, gated=args.gated, temperature=args.temperature)
    if args.initial:
        model.load(args.initial)
    critic = Critic(model.inputs, model.hidden)
    optimizer = torch.optim.Adam(list(model.parameters()) + list(critic.parameters()), lr=args.rate)
    current, rollout = output / "current.json", output / "rollout.f32"
    save(model, current)
    save(model, output / "initial.json")
    started, report = time.monotonic(), []
    worker = subprocess.Popen(["pnpm", "exec", "tsx", "harness/registeredRolloutWorker.ts"],
                              stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, start_new_session=True)
    try:
        for iteration in range(args.iterations):
            rollout_hash = hashlib.sha256(current.read_bytes()).hexdigest()
            request = {"model": str(current), "output": str(rollout), "worlds": args.worldCases,
                       "ticks": args.ticks, "warmup": args.warmup}
            worker.stdin.write(json.dumps(request) + "\n")
            worker.stdin.flush()
            line = worker.stdout.readline()
            if not line:
                raise RuntimeError(f"rollout worker exited: {worker.poll()}")
            metadata = json.loads(line)
            rows = np.fromfile(rollout, dtype="<f4").reshape(-1, metadata["columns"])
            if len(rows) != metadata["rows"]:
                raise ValueError("truncated rollout")
            metrics = update(model, critic, optimizer, rows, metadata, args)
            save(model, current)
            save(model, output / f"iteration-{iteration + 1}.json", rows)
            entry = {"iteration": iteration + 1, "rows": len(rows), "physics": metadata["physics"],
                     "rolloutModelHash": rollout_hash,
                     "modelHash": hashlib.sha256(current.read_bytes()).hexdigest(),
                     "outcomes": metadata["summaries"], "tasks": metadata["tasks"], **metrics}
            report.append(entry)
            (output / "training.json").write_text(json.dumps({"settings": vars(args), "iterations": report}))
            print(json.dumps({key: value for key, value in entry.items() if key != "tasks"}), flush=True)
    finally:
        close_worker(worker)
    # Generated optimizer state supports explicitly requested continuation without losing moments.
    torch.save({"model": model.state_dict(), "critic": critic.state_dict(), "optimizer": optimizer.state_dict()},
               output / "optimizer.pt")
    record(args, report, time.monotonic() - started)


if __name__ == "__main__":
    main()
