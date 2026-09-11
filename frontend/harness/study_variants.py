"""Generate declared single-connection diagnostic catalogs for the transfer harness.

These preserve the v5 container for validation, but are NOT observed populations.
Only genotype records 1/895 are read by the fresh-world contests. No body, position,
RNG or acquired memory from this container enters a fresh-world contest.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def generate(source, output):
    source = Path(source)
    data = source.read_bytes()
    original = json.loads(data)
    records = {g["id"]: g for g in original["genomes"]}
    ancestor = records[1]["genome"]
    observed = records[895]["genome"]
    locus = 1574
    value = observed["chromosomes"][0]["behavior"]["weights"][locus]
    if value != -0.07692401111125946:
        raise ValueError("Unexpected source allele; review the declared experiment")
    directory = Path(output)
    directory.mkdir(parents=True, exist_ok=True)
    for name in ("knockin", "reversion"):
        catalog = copy.deepcopy(original)
        genomes = {g["id"]: g for g in catalog["genomes"]}
        base = ancestor if name == "knockin" else observed
        genomes[1]["genome"] = copy.deepcopy(base)
        genomes[895]["genome"] = copy.deepcopy(base)
        new_value = value if name == "knockin" else 0
        genomes[895]["genome"]["chromosomes"][0]["behavior"]["weights"][locus] = new_value
        encoded = json.dumps(catalog, separators=(",", ":"), allow_nan=False).encode()
        path = directory / f"diagnostic-{name}.json"
        with path.open("xb") as file:
            file.write(encoded)
        metadata = {
            "kind": "diagnostic genotype catalog, not an observed population",
            "source": str(source), "source_sha256": digest(data),
            "generator_sha256": digest(Path(__file__).read_bytes()),
            "output_sha256": digest(encoded), "locus": locus,
            "connection": "hidden14 (task input) to toxin output",
            "group1": "founder" if name == "knockin" else "observed genotype 895",
            "group2": "group1 with exactly one inherited weight changed",
            "group2_allele": new_value,
        }
        with path.with_suffix(".provenance.json").open("x") as file:
            json.dump(metadata, file, indent=2)
        print(json.dumps(metadata))


if __name__ == "__main__":
    generate(*sys.argv[1:])
