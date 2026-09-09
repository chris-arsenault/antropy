"""Care replay includes premature actions and preserves ordinary trajectory coverage."""
import unittest

import torch

from registered_replay_priority import care_mistakes, sample_sequences


class PriorityTests(unittest.TestCase):
    def test_flags_premature_release_and_missed_eating_but_not_correct_care(self):
        logits = torch.zeros(4, 2, 19)
        logits[0, :, 7] = 1  # Releases when the teacher would move.
        logits[1, :, 3] = 1  # Moves when it should eat.
        logits[2, :, 6] = 1  # Correct feed.
        logits[3, :, 1] = 1  # A navigation mistake only.
        targets = torch.zeros(4, 2, 4)
        targets[:, :, 0] = torch.tensor([3, 5, 6, 3])[:, None]
        buckets = care_mistakes(logits, targets)
        self.assertEqual(buckets[7].tolist(), [True, False, False, False])
        self.assertEqual(buckets[5].tolist(), [False, True, False, False])
        self.assertFalse(bool(buckets[6].any()))
        self.assertFalse(bool(buckets[4].any()))

    def test_half_priority_retains_uniform_sampling_and_consecutive_sequences(self):
        sequences = torch.arange(3200).reshape(100, 32)
        buckets = {7: torch.tensor([99])}
        torch.manual_seed(7)
        selected = sample_sequences(sequences, buckets, 0.5)
        self.assertTrue((selected[:32] == sequences[99].numpy()).all())
        self.assertTrue((selected[32:, 0] != sequences[99, 0].item()).any())
        self.assertTrue((selected[:, 1:] - selected[:, :-1] == 1).all())
        with self.assertRaises(ValueError):
            sample_sequences(sequences, buckets, 1.1)

    def test_zero_priority_preserves_the_original_random_draw(self):
        sequences = torch.arange(3200).reshape(100, 32)
        torch.manual_seed(17)
        expected = sequences[torch.randint(len(sequences), (64,))].numpy()
        torch.manual_seed(17)
        actual = sample_sequences(sequences, {}, 0)
        self.assertTrue((actual == expected).all())


if __name__ == "__main__":
    unittest.main()
