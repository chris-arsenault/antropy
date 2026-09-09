"""Reproduce stage-local teaching, retained aggregation and physical PPO on declared worlds."""
import argparse
import sys
from pathlib import Path

from resume_registered_recovery import Continuation, digest


def teaching(pipeline, name, initial, worlds, assistance, epochs, batches, policy, replay=()):
    command = [sys.executable, "harness/train_registered_teaching.py", "--initial", str(initial),
               "--worlds", str(pipeline.root / worlds), "--output", str(pipeline.root / name),
               "--assistance", assistance, "--ticks", "8000", "--epochs", str(epochs),
               "--batches", str(batches), "--rate", "0.0005", "--stage-data", policy]
    if replay:
        command += ["--replay", *map(str, replay)]
    pipeline.run(name, command)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--study", type=Path, required=True)
    parser.add_argument("--initial", type=Path, required=True)
    args = parser.parse_args()
    if digest(args.initial) != "fa6648df3adcfb0aca47cc048aff52b72939841bec50515f4035867abe161057":
        raise ValueError("recipe requires the declared historical pre-task initializer")
    pipeline = Continuation(args.study)
    try:
        teaching(pipeline, "task-curriculum", args.initial, "train.json", "1,0.75,0.5,0.25,0",
                 15, 40, "latest")
        curriculum = args.study / "task-curriculum"
        teaching(pipeline, "aggregate", curriculum / "stage-5.json", "replay-worlds.json", "0,0,0",
                 20, 60, "all", [curriculum / "stage-0.f32", curriculum / "stage-4.f32"])
        pipeline.train("ppo-replay", "aggregate/stage-3.json", "replay-worlds.json", 12,
                       "0.0001", "0.005", "0.999")
        pipeline.train("ppo-long", "ppo-replay/iteration-12.json", "long-worlds.json", 24,
                       "0.00005", "0.0025", "0.9997")
        for name, model in [("curriculum", "task-curriculum/stage-5.json"),
                            ("aggregate", "aggregate/stage-3.json"),
                            ("ppo-replay", "ppo-replay/iteration-12.json"),
                            ("ppo-long", "ppo-long/iteration-24.json")]:
            pipeline.evaluate(name, model)
        pipeline.event("development-validation-completed", reservedTestsOpened=False)
    except BaseException as error:
        pipeline.event("stopped", error=repr(error))
        raise


if __name__ == "__main__":
    main()
