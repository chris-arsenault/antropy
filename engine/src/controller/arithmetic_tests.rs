use super::*;

fn close(actual: f32, expected: f32) {
    assert!(
        (actual - expected).abs() <= 5e-6 * (1. + expected.abs()),
        "{actual} != {expected}"
    );
}

#[test]
fn batched_projection_handles_hidden_and_output_dimensions_with_biases() {
    for (rows, columns) in [(24, 56), (38, 24)] {
        let weights: Vec<_> = (0..rows * columns)
            .map(|i| (i % 17) as f32 / 17. - 0.5)
            .collect();
        let input: Vec<_> = (0..columns).map(|i| (i % 7) as f32 / 7. - 0.5).collect();
        let bias: Vec<_> = (0..rows).map(|i| i as f32 / 31. - 0.5).collect();
        let mut output = vec![0.; rows];
        project(&weights, &input, &bias, &mut output);
        for row in 0..rows {
            let expected = weights[row * columns..(row + 1) * columns]
                .iter()
                .zip(&input)
                .map(|(a, b)| a * b)
                .sum::<f32>()
                + bias[row];
            close(output[row], expected);
        }
    }
}

#[test]
fn factored_recurrence_and_trace_update_preserve_paid_local_learning_law() {
    let weights: Vec<_> = (0..24).map(|i| (i % 9) as f32 / 9. - 0.5).collect();
    let old: Vec<_> = (0..24).map(|i| (i % 7) as f32 / 7. - 0.5).collect();
    let initial: Vec<_> = (0..24).map(|i| (i % 5) as f32 / 5. - 0.5).collect();
    for alpha in [0., 0.1, 1.] {
        let expected = weights.iter().zip(&old).map(|(w, x)| w * x).sum::<f32>()
            + alpha * initial.iter().zip(&old).map(|(h, x)| h * x).sum::<f32>();
        close(recurrent(&weights, &initial, &old, alpha), expected);
    }
    for (rate, modulation, y) in [(0., 0.3, 0.9), (0.016, -0.2, 0.7), (10., 1., -1.)] {
        let [a, b, c, d] = [0.8, -0.2, 0.3, 0.1];
        let mut trace = initial.clone();
        trace_row(
            &mut trace,
            &old,
            1. - rate * y * y,
            rate * modulation * (a * y + b),
            rate * modulation * (c * y + d),
        );
        for ((actual, h), x) in trace.into_iter().zip(&initial).zip(&old) {
            let expected = (h + rate * (modulation * (a * x * y + b * x + c * y + d) - y * y * h))
                .clamp(-1., 1.);
            close(actual, expected);
        }
    }
}
