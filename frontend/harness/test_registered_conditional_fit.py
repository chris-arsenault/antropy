"""Conditional replay preserves policy preferences without a runtime task router."""
import unittest

import torch

from registered_conditional_fit import correction_loss, correction_targets


class ConditionalFitTests(unittest.TestCase):
    def test_roles_and_care_commands_select_training_targets(self):
        x = torch.zeros(1, 5, 151)
        x[0, 0, -8 + 2] = 1  # Keep current care role.
        targets = torch.tensor([[1, 0], [2, 8], [7, 1], [3, 6], [2, 1]])
        baseline = torch.randn(5, 19)
        physical, care = correction_targets(x, targets, baseline)
        self.assertEqual(care.tolist(), [True, True, True, False, False])
        self.assertEqual(physical[:3].argmax(-1).tolist(), [1, 2, 7])
        self.assertTrue(torch.allclose(physical.sum(-1), torch.ones(5)))
        self.assertTrue(torch.equal(physical[3:, 4:], torch.zeros(2, 4)))
        self.assertTrue(torch.allclose(physical[3:, :4], baseline[3:, :4].softmax(-1)))

    def test_task_and_secretion_gradients_preserve_frozen_policy(self):
        x = torch.zeros(1, 2, 151)
        targets = torch.tensor([[3, 1], [6, 3]])
        baseline = torch.randn(2, 19)
        logits = baseline.clone().requires_grad_()
        loss = correction_loss(logits, baseline, x, targets, torch.ones(8))
        loss.backward()
        self.assertTrue(torch.isfinite(loss))
        self.assertLess(float(logits.grad[:, 8:].abs().max()), 1e-7)
        self.assertGreater(float(logits.grad[1, 6].abs()), 0)


if __name__ == "__main__":
    unittest.main()
