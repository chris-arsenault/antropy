"""Compare a bounded current collection with the prefix of a captured control dataset."""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--control", type=Path, required=True)
    parser.add_argument("--ticks", type=int, default=640)
    args = parser.parse_args()
    control = json.loads((args.control / "training.json").read_text())
    settings = control["settings"]
    model = json.loads(Path(settings["initial"]).read_text())
    if model["temperature"] != settings["temperature"] or args.ticks > settings["ticks"]:
        raise ValueError("prefix comparison requires the same policy temperature and horizon")
    with tempfile.TemporaryDirectory(prefix="antropy-collection-") as directory:
        path = Path(directory) / "rows.f32"
        request = {"model": settings["initial"], "output": str(path),
                   "worlds": settings["worldCases"][:1], "ticks": args.ticks,
                   "assistance": control["stages"][0]["assistance"]}
        result = subprocess.run(["pnpm", "exec", "tsx", "harness/registeredTeachingWorker.ts"],
                                input=json.dumps(request) + "\n", text=True, capture_output=True)
        if result.returncode:
            raise RuntimeError(result.stderr)
        metadata = json.loads(result.stdout)
        actual = path.read_bytes()
        with (args.control / "stage-0.f32").open("rb") as stream:
            expected = stream.read(len(actual))
        if not actual or actual != expected:
            raise ValueError("streamed collection differs from the recorded control prefix")
        if len(actual) != metadata["rows"] * metadata["columns"] * 4:
            raise ValueError("streamed record count does not match its byte length")
        print(json.dumps({"rows": metadata["rows"], "bytes": len(actual), "identical": True,
                          "sha256": hashlib.sha256(actual).hexdigest()}))


if __name__ == "__main__":
    main()
