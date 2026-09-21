"""Consumer edge cases using a real current producer's artifact as the schema fixture."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from evolve_chemistry import describe, inherited_vectors, read_manifest, TRAITS


class ReportContract(unittest.TestCase):
    def test_current_producer_contract(self):
        source = next(Path(sys.argv[1]).glob("*/manifest.json")).parent
        manifest = read_manifest(source)
        self.assertEqual(manifest["checkpointVersion"], 34)
        values = inherited_vectors(source, manifest["checkpointVersion"])
        genome = json.loads((source / "genomes.jsonl").read_text().splitlines()[0])
        body = genome["facts"]["blueprint"]
        slots = genome["facts"]["expressed"]["chemistry"]["transporters"]
        self.assertTrue(all("export" not in slot for slot in slots))
        vector = dict(zip(TRAITS, values[genome["genotype"]["id"]]))
        self.assertAlmostEqual(vector["transporters"], sum(body[7:11]) / body[0])
        self.assertNotIn("importers", vector)
        for axis in ("x", "y"):
            expected = sum(body[7 + i] * slot[axis] for i, slot in enumerate(slots)) / sum(body[7:11])
            self.assertAlmostEqual(vector["transport" + axis.upper()], expected)

    def test_report_capacity_bounds(self):
        import numpy as np
        from seed_cycle_findings import capacity_blocks
        source = next(Path(sys.argv[1]).glob("*/manifest.json")).parent
        manifest = read_manifest(source)
        genome = json.loads((source / "genomes.jsonl").read_text().splitlines()[0])
        small_parent = np.asarray([genome["facts"]["blueprint"]]) * 0.2
        blocked = capacity_blocks(small_parent, manifest["config"])
        self.assertFalse(any(bool(result[0]) for result in blocked))
        legacy = {**manifest["config"], "daughterInventory": 0.3, "daughterEnergy": 0.1, "divisionCost": 0.08}
        del legacy["daughterInventoryFraction"]
        self.assertTrue(capacity_blocks(small_parent, legacy)[0][0])

    def test_interruption_extinction_and_schema(self):
        from evolve_report import kmeans
        source = next(Path(sys.argv[1]).glob("*/manifest.json")).parent
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("manifest.json", "genomes.jsonl", "samples.jsonl"):
                (root / name).write_bytes((source / name).read_bytes())
            row, _ = describe(root, 2, kmeans)
            self.assertEqual(row["groups"], 1)
            self.assertEqual(row["sharesPercent"][-1], [100])
            samples = (root / "samples.jsonl").read_text()
            (root / "samples.jsonl").write_text(samples + '{"tick":')
            row, _ = describe(root, 2, kmeans)
            self.assertEqual(len(row["interruptions"]), 1)
            self.assertEqual(row["groups"], 1)
            (root / "samples.jsonl").write_text('{"tick":\n' + samples)
            with self.assertRaises(json.JSONDecodeError):
                describe(root, 2, kmeans)
            (root / "samples.jsonl").write_text('{"tick":20,"cells":[]}\n')
            row, _ = describe(root, 2, kmeans)
            self.assertEqual(row["population"], 0)
            self.assertEqual(row["groups"], 0)
            (root / "samples.jsonl").write_text("")
            row, _ = describe(root, 2, kmeans)
            self.assertEqual(row["coverage"], "no captured observations")
            self.assertIsNone(row["tick"])
            manifest = json.loads((root / "manifest.json").read_text())
            manifest["checkpointVersion"] = 999
            (root / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "physical checkpoint schema"):
                describe(root, 2, kmeans)


if __name__ == "__main__":
    selected = ["ReportContract.test_current_producer_contract"] if "--contract" in sys.argv else []
    unittest.main(argv=[sys.argv[0], *selected])
