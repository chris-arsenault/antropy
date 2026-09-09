"""An isolated care update must preserve all recurrent, task and pheromone weights."""
import unittest

import torch

from registered_care_fit import freeze_except_physical_care, verify_frozen
from registered_network import RegisteredNetwork


class CareFitTests(unittest.TestCase):
    def test_optimizer_changes_only_physical_care_rows(self):
        torch.manual_seed(17)
        model = RegisteredNetwork(history=0, hidden=2, embedding=2, tasks=2)
        original = freeze_except_physical_care(model)
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        logits, _ = model(torch.randn(2, 4, model.inputs))
        logits.square().mean().backward()
        optimizer.step()
        self.assertFalse(torch.equal(model.care.weight[:5], original["care.weight"][:5]))
        result = verify_frozen(model, original)
        self.assertTrue(result["frozenWeightsUnchanged"])
        self.assertEqual(result["effectiveTrainableParameters"], 15)
        with torch.no_grad():
            model.task_head.bias[0] += 1
        with self.assertRaisesRegex(ValueError, "frozen weights"):
            verify_frozen(model, original)


if __name__ == "__main__":
    unittest.main()
