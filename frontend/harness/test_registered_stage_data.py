"""Curriculum distribution changes must not silently discard explicitly retained replay."""
import unittest

from registered_demonstrations import stage_datasets


class StageDataTests(unittest.TestCase):
    def test_stage_local_curriculum_and_retained_aggregation(self):
        stages = ["assisted", "mixed", "autonomous"]
        self.assertEqual(stage_datasets([], stages, "latest"), ["autonomous"])
        self.assertEqual(stage_datasets(["teacher", "old-errors"], stages, "all"),
                         ["teacher", "old-errors", *stages])
        self.assertEqual(stage_datasets(["teacher"], stages, "latest"),
                         ["teacher", "autonomous"])
        self.assertEqual(stages, ["assisted", "mixed", "autonomous"])
        with self.assertRaises(ValueError):
            stage_datasets([], stages, "implicit")


if __name__ == "__main__":
    unittest.main()
