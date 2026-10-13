"""Inspect, configure and checkpoint the native World through its operator API."""
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
    parser.add_argument("--output", type=Path, help="Optional new local capture directory")
    parser.add_argument("--apply", choices=("live", "restart"), default="live")
    parser.add_argument("--preview", action="store_true", help="Validate a patch without applying")
    parser.add_argument("--save-point", action="store_true", help="Pause and store a manual checkpoint")
    parser.add_argument("--load", help="Restore a stored checkpoint while paused")
    parser.add_argument("--running", choices=("true", "false"), help="Explicit final running state")
    parser.add_argument("--base", default="http://192.168.66.3:8095")
    args = parser.parse_args()
    if args.preview and (args.save_point or args.load or args.running):
        parser.error("preview cannot save, load or change running state")
    if args.seed is not None and args.apply != "restart":
        parser.error("--seed requires --apply restart")
    headers = {"Authorization": "Bearer " + os.environ["BIOTROPY_TOKEN"]}

    def request(path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(args.base + path, data=data, headers={
            **headers, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=35) as response:
            return json.load(response)

    before = request("/api/status")
    active_generation = before["generation"]
    def control(op, payload):
        return request("/api/control", {"generation":active_generation,
                                        "op":op, "payload":payload})
    if args.output:
        args.output.mkdir(parents=True, exist_ok=False)
    def record(name, value):
        if args.output:
            (args.output / name).write_text(json.dumps(value, indent=2) + "\n")
    record("before.json", before)
    if args.load:
        loaded = request("/api/checkpoints/" + args.load + "/load",
                         {"generation":before["generation"], "running":False})
        record("loaded.json", loaded)
        before = request("/api/status")
        active_generation = before["generation"]
        if before["running"]:
            raise RuntimeError("restored checkpoint did not remain paused")
    if args.save_point:
        control("running", {"value":False})
        status = request("/api/status")
        if status["generation"] != active_generation:
            raise RuntimeError("world changed before saving the comparison point")
        saved = request("/api/checkpoints", {"generation":active_generation})
        record("save-point.json", saved)
        print(json.dumps({"savePoint":saved}))
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
    record("requested.json", {"seed": seed, "config": config})
    # Never retry an uncertain control outcome. Inspect status before another command.
    if args.config or args.set or args.seed is not None:
        if args.apply == "restart":
            if args.preview:
                raise RuntimeError("restart preview is unavailable; use live preview for runtime fields")
            result = control("restart", {"seed":seed, "config":config})
            active_generation = result["status"]["generation"]
            record("restart.json", result)
        else:
            patch = {key:value for key,value in config.items() if before["config"].get(key) != value}
            if patch:
                result = control("configure", {"patch":patch, "preview":args.preview,
                                 "revision":before["runControls"]["revision"]})
                record("configured.json", result)
                if args.preview:
                    print(json.dumps(result))
                    return
    if args.running:
        control("running", {"value":args.running == "true"})
    after = request("/api/status")
    record("after.json", after)
    expected = before["generation"] + int(args.apply == "restart" and bool(args.config or args.set or args.seed is not None))
    if after["generation"] != expected or after["seed"] != seed:
        raise RuntimeError("restart outcome disagrees with the requested generation or seed")
    effective = after.get("runControls", {}).get("pending") or after["config"]
    if not config_matches(config, effective):
        raise RuntimeError("effective configuration disagrees with the requested configuration")
    print(json.dumps({"generation": after["generation"], "tick": after["tick"],
                      "population": after["population"], "running": after["running"],
                      "config":after["config"], "controls":after.get("runControls"),
                      "evidence": str(args.output) if args.output else None}))


if __name__ == "__main__":
    main()
