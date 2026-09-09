"""Continue the declared recovery recipe after its running autonomous aggregation finishes.

Run from frontend. This runner stops after development validation; it cannot select a model,
open reserved test worlds, or change the browser. Existing output directories are never reused.
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class Continuation:
    def __init__(self, root):
        self.root = root
        self.events = []
        self.status = root / "continuation.json"
        if self.status.exists():
            raise ValueError("continuation record already exists")
        self.event("started", sourceHash=digest(Path(__file__)))

    def event(self, stage, **values):
        entry = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "stage": stage, **values}
        self.events.append(entry)
        self.status.write_text(json.dumps(self.events, indent=2))
        print(json.dumps(entry), flush=True)

    def run(self, stage, command):
        self.event(stage, state="running", command=command)
        with (self.root / f"{stage}.log").open("x") as log:
            result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
        self.event(stage, state="completed" if result.returncode == 0 else "failed", exitCode=result.returncode)
        result.check_returncode()

    def wait_aggregation(self, pid):
        self.event("waiting-for-aggregation", pid=pid)
        while True:
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                break
            time.sleep(10)
        report = read(self.root / "aggregate/training.json")
        if len(report["stages"]) != 3 or any(stage["assistance"] != 0 for stage in report["stages"]):
            raise ValueError("aggregation did not finish all three autonomous stages")
        if report["settings"]["initialHash"] != digest(self.root / "task-curriculum/stage-5.json"):
            raise ValueError("aggregation did not descend from this curriculum")
        curriculum = read(self.root / "task-curriculum/training.json")
        if curriculum["settings"]["initialHash"] != "fa6648df3adcfb0aca47cc048aff52b72939841bec50515f4035867abe161057":
            raise ValueError("curriculum did not use the declared historical v4 initializer")
        self.event("aggregation-verified", stages=3, modelHash=digest(self.root / "aggregate/stage-3.json"))

    def train(self, name, initial, worlds, iterations, rate, entropy, trace):
        self.run(name, [sys.executable, "harness/train_registered.py", "--initial", str(self.root / initial),
                       "--worlds", str(self.root / worlds), "--output", str(self.root / name),
                       "--iterations", str(iterations), "--ticks", "2048", "--temperature", "0.25",
                       "--rate", rate, "--entropy", entropy, "--gamma", "0.9995", "--trace", trace,
                       "--sequence", "32", "--batch", "64", "--epochs", "3"])

    def evaluate(self, name, model):
        self.run(f"validation-{name}", ["pnpm", "exec", "tsx", "harness/nestGeneralization.ts", "evaluate",
                                      str(self.root / "validation.json"), str(self.root / model),
                                      str(self.root / f"validation-{name}.json")])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", type=Path, required=True)
    parser.add_argument("--aggregation-pid", type=int, required=True)
    args = parser.parse_args()
    pipeline = Continuation(args.study)
    try:
        pipeline.wait_aggregation(args.aggregation_pid)
        pipeline.train("ppo-replay", "aggregate/stage-3.json", "replay-worlds.json", 12,
                       "0.0001", "0.005", "0.999")
        pipeline.train("ppo-long", "ppo-replay/iteration-12.json", "long-worlds.json", 24,
                       "0.00005", "0.0025", "0.9997")
        for name, model in [("aggregate", "aggregate/stage-3.json"),
                            ("ppo-replay", "ppo-replay/iteration-12.json"),
                            ("ppo-long", "ppo-long/iteration-24.json")]:
            pipeline.evaluate(name, model)
        pipeline.event("development-validation-completed", reservedTestsOpened=False)
    except BaseException as error:
        pipeline.event("stopped", error=repr(error))
        raise


if __name__ == "__main__":
    main()
