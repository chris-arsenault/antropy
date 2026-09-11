"""Run the registered screening panels; each run is bounded and append-only.

From frontend: python harness/strategy_batch.py toxin|motor
Two worker processes share no world state. Output logs are generated artifacts.
"""
import concurrent.futures
import itertools
import subprocess
import sys
from pathlib import Path

OUTPUT = Path("harness/artifacts/strategies-2026-09-10")


def panel(kind):
    if kind == "toxin":
        for seed, swap in itertools.product([201, 202], ["false", "true"]):
            yield f"toxin-off-{seed}-{swap}", [
                "--mode", "contest", "--knockout", "damage", "--ticks", "6000",
                "--checkpoint", "harness/artifacts/adaptation-2026-09-10/variants/diagnostic-knockin.json",
                "--seed", str(seed), "--swap", swap,
            ]
    elif kind == "motor":
        for lifetime, spacing, seed, swap in itertools.product(
            [100, 1000], [2, 24], [301, 302], ["false", "true"]
        ):
            yield f"motor-{lifetime}-{spacing}-{seed}-{swap}", [
                "--mode", "motor", "--environment", "scheduled", "--ticks", "20000",
                "--lifetime", str(lifetime), "--spacing", str(spacing),
                "--seed", str(seed), "--swap", swap,
            ]
    else:
        raise ValueError("Expected toxin or motor")


def run(item):
    name, flags = item
    command = ["pnpm", "exec", "tsx", "harness/lib/studyCli.ts", "--run", name,
               "--output", str(OUTPUT), *flags]
    with (OUTPUT / f"{name}.log").open("x") as log:
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=1800)
    if result.returncode:
        raise RuntimeError(f"{name} failed: inspect its log")
    print(f"complete {name}", flush=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(run, panel(sys.argv[1])))
