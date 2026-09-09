"""Bounded checks for the physical contact columns used in replay diagnostics."""
import json
import unittest

import numpy as np
import torch

from diagnose_registered_replay import audit


class FeedPolicy:
    inputs, hidden = 151, 64

    def __call__(self, x, state):
        logits = torch.zeros(x.shape[0], 1, 19)
        logits[:, :, 6] = 1
        return logits, state


class ReplayAuditTests(unittest.TestCase):
    def test_cargo_and_contact_offsets_and_world_separation(self):
        model = FeedPolicy()
        offset = model.inputs + model.hidden
        rows = np.zeros((4, offset + 7), dtype=np.float32)
        rows[:, offset] = [6, 1, 4, 3]
        rows[:, offset + 4] = [1, 1, 2, 2]
        rows[:2, 82] = 0.25
        rows[0, 36] = 1  # Hungry recipient directly ahead.
        rows[1, 41] = 1  # Recipient one bearing to the left.
        rows[2:, 81] = 0.8  # Hunger is not cargo.
        rows[2:, 35] = 1  # Edible is not a recipient.
        report = audit(model, rows)
        self.assertEqual(report[1]["loadedRecipientContacts"], 2)
        self.assertEqual(report[1]["loadedFrontRecipientContacts"], 1)
        self.assertEqual(report[1]["feedsFacingRecipient"], 1)
        self.assertEqual(report[2]["loadedRecipientContacts"], 0)
        self.assertEqual(report[2]["emptyFeeds"], 2)
        self.assertEqual(report[1]["confusion"][1][6], 1)
        self.assertIn('"1"', json.dumps(report))


if __name__ == "__main__":
    unittest.main()
