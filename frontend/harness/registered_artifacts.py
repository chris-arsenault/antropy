"""Capture code used by an experiment before workers or optimization start."""
import hashlib
import shutil
from pathlib import Path


def file_digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def capture_sources(output):
    root = Path(__file__).parent.parent
    sources = list((root / "src/sim").rglob("*.ts"))
    sources += [path for path in (root / "harness").glob("*registered*.py")]
    sources += [root / "harness/registeredTeachingWorker.ts", root / "harness/registeredRolloutWorker.ts",
                root / "harness/lib/registeredRollout.ts", root / "harness/lib/colonyOutcome.ts",
                root / "harness/lib/colonyWorlds.ts", root / "harness/lib/floatRows.ts",
                root / "harness/nestGeneralization.ts",
                root / "harness/lib/colonyOutcomeRun.ts", root / "harness/lib/colonyArtifacts.ts",
                root / "harness/lib/learnedColony.ts", root / "harness/lib/colonyCare.ts",
                root / "harness/lib/colonyMotion.ts", root / "harness/lib/taskTelemetry.ts",
                root / "harness/selectGeneralization.ts", root / "harness/prepareGeneralizationReview.ts",
                root / "harness/summarize_generalization.py", root / "harness/lib/ledger.ts",
                root / "harness/directional_network.py"]
    hashes = {}
    for source in sources:
        if source.name.endswith(".test.ts"):
            continue
        relative = source.relative_to(root)
        destination = output / "sources" / (str(relative) + ".source")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        hashes[str(relative)] = hashlib.sha256(destination.read_bytes()).hexdigest()
    return hashes
