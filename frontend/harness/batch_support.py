"""Shared append-only subprocess runner for explicitly registered local campaigns."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess


def parser(description):
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--seeds", required=True, help="Explicit comma-separated world seeds")
    p.add_argument("--registration", type=Path, required=True)
    p.add_argument("--wall-seconds", type=int, required=True)
    p.add_argument("--workers", type=int, default=1, choices=range(1, 7))
    return p


def execute(args, jobs):
    if args.wall_seconds < 1:
        raise ValueError("Positive per-run wall budget required")
    registration = args.registration.read_bytes()
    if not registration.strip():
        raise ValueError("Registration must state question, controls, horizon and escalation decision")
    args.output.mkdir(parents=True, exist_ok=True)
    jobs = list(jobs)
    plan = {"schemaVersion": 3, "registration": str(args.registration),
            "registrationSha256": hashlib.sha256(registration).hexdigest(),
            "jobs": jobs, "wallSecondsPerRun": args.wall_seconds,
            "maximumRunSeconds": len(jobs) * args.wall_seconds, "workers": args.workers}
    with (args.output / "batch-registration.json").open("x") as stream:
        json.dump(plan, stream, indent=2)

    def run(job):
        label, script, flags = job
        command = ["pnpm", "exec", "tsx", script, *flags,
                   "--output", str(args.output), "--wall-seconds", str(args.wall_seconds),
                   "--justification", str(args.registration)]
        with (args.output / f"{label}.log").open("x") as stream:
            result = subprocess.run(command, stdout=stream, stderr=subprocess.STDOUT,
                                    timeout=args.wall_seconds + 120)
        if result.returncode:
            raise RuntimeError(f"Failed {label}: exit {result.returncode}; inspect its log")
        manifest = json.loads((args.output / label / "manifest.json").read_text())
        row = {"run": label, "status": manifest["status"], "stop": manifest["stop"]}
        print(json.dumps(row), flush=True)
        return row

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        rows = list(pool.map(run, jobs))
    (args.output / "batch-results.json").write_text(json.dumps(rows, indent=2))


def seeds(args):
    values = [int(v) for v in args.seeds.split(",")]
    if not values or len(set(values)) != len(values):
        raise ValueError("Specify distinct seeds")
    return values
