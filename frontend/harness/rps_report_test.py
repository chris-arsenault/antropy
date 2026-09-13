"""Regression checks for the count-versus-frequency error in the September 13 reports."""
import unittest

from rps_report import frequencies


def groups(rare, resident):
    return [
        {"genome": 1, "initialCells": 7, "living": rare},
        {"genome": 2, "initialCells": 57, "living": resident},
    ]


class FrequencyTests(unittest.TestCase):
    def test_growing_count_can_lose_share(self):
        rare = frequencies(groups(12, 258))[0]
        self.assertGreater(rare["living"], rare["initial"])
        self.assertAlmostEqual(rare["initialSharePercent"], 10.9375)
        self.assertAlmostEqual(rare["finalSharePercent"], 100 * 12 / 270)
        self.assertLess(rare["changePercentagePoints"], 0)

    def test_growth_in_proportion_is_no_frequency_advantage(self):
        self.assertEqual(frequencies(groups(14, 114))[0]["changePercentagePoints"], 0)

    def test_whole_population_extinction_has_no_final_frequency(self):
        for row in frequencies(groups(0, 0)):
            self.assertIsNone(row["finalSharePercent"])
            self.assertIsNone(row["changePercentagePoints"])

    def test_extinct_group_is_zero_when_residents_survive(self):
        rare = frequencies(groups(0, 57))[0]
        self.assertEqual(rare["finalSharePercent"], 0)
        self.assertEqual(rare["changePercentagePoints"], -10.9375)


if __name__ == "__main__":
    unittest.main()
