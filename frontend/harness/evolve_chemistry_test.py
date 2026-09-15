"""Consumer edge cases using a real current producer's artifact as the schema fixture."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from evolve_chemistry import describe
from evolve_report import kmeans


class ReportContract(unittest.TestCase):
    def test_interruption_extinction_and_schema(self):
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
    unittest.main(argv=[sys.argv[0]])
