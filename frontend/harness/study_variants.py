"""Create diagnostic allele catalogs through the sole WASM engine.

Accepts --checkpoint, --output, --ancestor, --candidate, --part,
--homolog and --slot. Outputs v10 binary catalogs and explicit provenance.
"""
import subprocess
import sys
from pathlib import Path


if __name__ == "__main__":
    frontend = Path(__file__).resolve().parent.parent
    subprocess.run(["pnpm", "exec", "tsx", "harness/lib/studyVariants.ts", *sys.argv[1:]],
                   cwd=frontend, check=True)
