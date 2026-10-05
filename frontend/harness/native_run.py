"""Apply a run-start configuration patch through the existing native operator API."""
import argparse
import json
import math
import os
import urllib.request
from pathlib import Path


def merge(target, patch):
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            merge(target[key], value)
        else:
            target[key] = value


def config_matches(requested, effective):
    if isinstance(requested, dict):
        return (isinstance(effective, dict) and requested.keys() == effective.keys()
                and all(config_matches(value, effective[key])
                        for key, value in requested.items()))
    if isinstance(requested, list):
        return (isinstance(effective, list) and len(requested) == len(effective)
                and all(config_matches(a, b) for a, b in zip(requested, effective)))
    if isinstance(requested, bool) or isinstance(effective, bool):
        return type(requested) is type(effective) and requested == effective
    if isinstance(requested, (int, float)) and isinstance(effective, (int, float)):
        if isinstance(requested, int) and isinstance(effective, int):
            return requested == effective
        # Permit only floating-point serialization roundoff, not changed settings.
        return (math.isfinite(requested) and math.isfinite(effective)
                and abs(requested - effective)
                <= 2 * max(math.ulp(requested), math.ulp(effective)))
    return type(requested) is type(effective) and requested == effective


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, help="JSON patch, merged into the running config")
    parser.add_argument("--set", action="append", default=[], metavar="PATH=JSON")
    parser.add_argument("--seed", type=int, help="Defaults to the current world's seed")
    parser.add_argument("--output", type=Path, required=True, help="New local evidence directory")
    parser.add_argument("--base", default="http://192.168.66.3:8095")
    args = parser.parse_args()
    if not args.config and not args.set:
        parser.error("provide --config or at least one --set override")
    headers = {"Authorization": "Bearer " + os.environ["BIOTROPY_TOKEN"]}

    def request(path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(args.base + path, data=data, headers={
            **headers, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=35) as response:
            return json.load(response)

    before = request("/api/status")
    config = json.loads(json.dumps(before["config"]))
    if args.config:
        merge(config, json.loads(args.config.read_text()))
    for assignment in args.set:
        path, encoded = assignment.split("=", 1)
        node = config
        parts = path.split(".")
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node[parts[-1]] = json.loads(encoded)
    seed = before["seed"] if args.seed is None else args.seed
    args.output.mkdir(parents=True, exist_ok=False)

    def record(name, value):
        (args.output / name).write_text(json.dumps(value, indent=2) + "\n")

    record("before.json", before)
    record("requested.json", {"seed": seed, "config": config})
    # Never retry an uncertain control outcome. Inspect status before another command.
    result = request("/api/control", {"generation": before["generation"], "op": "restart",
                                     "payload": {"seed": seed, "config": config}})
    record("restart.json", result)
    after = request("/api/status")
    record("after.json", after)
    if after["generation"] != before["generation"] + 1 or after["seed"] != seed:
        raise RuntimeError("restart outcome disagrees with the requested generation or seed")
    if not config_matches(config, after["config"]):
        raise RuntimeError("effective configuration disagrees with the requested configuration")
    print(json.dumps({"generation": after["generation"], "tick": after["tick"],
                      "population": after["population"], "running": after["running"],
                      "evidence": str(args.output)}))


if __name__ == "__main__":
    main()
