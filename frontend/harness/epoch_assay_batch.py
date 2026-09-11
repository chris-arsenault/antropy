"""Registered pre/post-B population assays; run after the epoch campaign.

python3 harness/epoch_assay_batch.py [root] [workers]
"""
import concurrent.futures
import json
import subprocess
import sys
from pathlib import Path
from epoch_batch import SEEDS


def run_one(root, seed, share, swap):
    label = f"assay-{seed}-{share}-{str(swap).lower()}"
    manifest = root / label / "manifest.json"
    if manifest.exists():
        if json.loads(manifest.read_text())["status"] == "complete":
            return {"run": label, "status": "already complete"}
        raise RuntimeError(f"Inspect incomplete attempt: {manifest}")
    for tick in (50000, 100000):
        if not (root / f"live-{seed}" / f"checkpoint-{tick}.json").exists():
            return {"run": label, "status": "unavailable", "missing_tick": tick}
    command = ["timeout", "900s", "pnpm", "exec", "tsx", "harness/epochAssay.ts", "--seed", str(seed),
               "--share", str(share), "--swap", str(swap).lower(), "--root", str(root)]
    print(json.dumps({"run": label, "status": "starting"}), flush=True)
    with (root / f"{label}.log").open("x") as log:
        completed = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
    if completed.returncode:
        raise RuntimeError(f"Failed {label}: {completed.returncode}")
    data = json.loads((root / label / "result.json").read_text())
    row = {"run": label, "status": "complete", "counts": data["cohorts"][-1]}
    print(json.dumps(row), flush=True)
    return row


def main():
    root = Path(sys.argv[1] if len(sys.argv)>1 else "harness/artifacts/epochs-2026-09-11")
    workers = int(sys.argv[2]) if len(sys.argv)>2 else 6
    if not 1 <= workers <= 6:
        raise ValueError("Use 1..6 workers")
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(run_one, root, seed, share, swap)
                   for seed in SEEDS for share in (0.8, 0.2) for swap in (False, True)]
        rows = [future.result() for future in futures]
    (root / "assay-batch.json").write_text(json.dumps(rows, indent=2))
    print(json.dumps({"finished": len(rows), "output": str(root)}), flush=True)


if __name__ == "__main__":
    main()
