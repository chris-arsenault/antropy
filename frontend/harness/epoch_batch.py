"""Bounded epoch campaign, six processes maximum. All outputs remain local.

python3 harness/epoch_batch.py [output-directory]
"""
import concurrent.futures
import json
import subprocess
import sys
from pathlib import Path

SEEDS = tuple(101*i for i in range(1, 13))


def run_one(root, seed, frozen):
    label = f'{"frozen" if frozen else "live"}-{seed}'
    manifest = root / label / "manifest.json"
    if manifest.exists():
        data = json.loads(manifest.read_text())
        if data["status"] == "complete":
            return {"run": label, "status": "already complete"}
        raise RuntimeError(f"Unfinished previous attempt: {manifest}; inspect before restarting")
    command = ["pnpm", "exec", "tsx", "harness/epochRun.ts", "--seed", str(seed),
               "--frozen", str(frozen).lower(), "--output", str(root)]
    log = root / f"{label}.log"
    print(json.dumps({"run": label, "status": "starting"}), flush=True)
    with log.open("x") as stream:
        result = subprocess.run(["timeout", "2700s", *command], stdout=stream, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f"{label} failed with {result.returncode}; see {log}")
    data = json.loads((root / label / "result.json").read_text())
    row = {"run": label, "status": "complete", "tick": data["final"]["tick"],
           "population": data["final"]["population"], "ledger": data["ledgerId"]}
    print(json.dumps(row), flush=True)
    return row


def main():
    root = Path(sys.argv[1] if len(sys.argv)>1 else "harness/artifacts/epochs-2026-09-11")
    root.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(run_one, root, seed, frozen) for seed in SEEDS for frozen in (False, True)]
        rows = [future.result() for future in futures]
    (root / "batch.json").write_text(json.dumps(rows, indent=2))
    print(json.dumps({"complete": len(rows), "output": str(root)}), flush=True)


if __name__ == "__main__":
    main()
