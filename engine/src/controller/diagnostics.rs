//! Fixture authoring stays behind the controller boundary; inference remains ordinary act().
use super::*;

/// Fixed capacity-fixture variation; callers do not inspect the controller representation.
pub fn perturb_weights(genome: &mut Genome, rng: &mut Random) {
    mutate_vector(&mut genome.weights, rng, 0.1, 0.03, 16.);
}

#[derive(Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub struct Changes {
    swim_bias_delta: f32,
    inventory_brake: Option<f32>,
    motor_gain: Option<f32>,
    recurrence: Option<String>,
    transport: Option<[f32; 4]>,
    chemotaxis: Option<usize>,
    plasticity_alpha: Option<f32>,
}

/// Invert the kernel's monotone activation, rather than assuming an exact tanh.
fn logit(value: f32) -> f32 {
    let (mut low, mut high) = (-3., 3.);
    for _ in 0..24 {
        let mid = (low + high) / 2.;
        if squash(mid) < value {
            low = mid;
        } else {
            high = mid;
        }
    }
    (low + high) / 2.
}
pub fn change(base: &Genome, c: &Changes) -> Result<Genome, String> {
    if !c.swim_bias_delta.is_finite()
        || [c.inventory_brake, c.motor_gain, c.plasticity_alpha]
            .into_iter()
            .flatten()
            .any(|x| !x.is_finite())
        || c.chemotaxis.is_some_and(|s| s >= 4)
        || c.recurrence.as_ref().is_some_and(|r| r != "zero")
        || c.transport
            .is_some_and(|t| t.iter().any(|x| !x.is_finite() || !(0. ..=1.).contains(x)))
    {
        return Err("Invalid controller intervention".into());
    }
    let mut g = base.clone();
    let w = &mut g.weights;
    w[OUTPUT_BIAS] += c.swim_bias_delta;
    if let Some(alpha) = c.plasticity_alpha {
        g.plasticity[0] = alpha;
    }
    if c.recurrence.is_some() {
        w[RECURRENT..BIAS].fill(0.);
    }
    if let Some(brake) = c.inventory_brake {
        w[20 * INPUTS..21 * INPUTS].fill(0.);
        w[20 * INPUTS + 37] = 1.5;
        w[OUTPUT + 20] = -brake;
    }
    if let Some(gain) = c.motor_gain {
        for output in 0..2 {
            for h in 0..HIDDEN {
                w[OUTPUT + output * HIDDEN + h] *= gain;
            }
            w[OUTPUT_BIAS + output] *= gain;
        }
    }
    if let Some(transport) = c.transport {
        for (slot, effort) in transport.into_iter().enumerate() {
            w[OUTPUT + (5 + slot) * HIDDEN..OUTPUT + (6 + slot) * HIDDEN].fill(0.);
            w[OUTPUT_BIAS + 5 + slot] = logit(2. * effort - 1.);
        }
    }
    if let Some(selected) = c.chemotaxis {
        for slot in 0..4 {
            if slot != selected {
                w[slot * 4 * INPUTS..(slot + 1) * 4 * INPUTS].fill(0.);
            }
        }
    }
    validate(&g)?;
    Ok(g)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn authored_effort_uses_kernel_activation_without_changing_parent() {
        let original = seed();
        let changes = Changes {
            transport: Some([0., 0.2, 0.6, 1.]),
            ..Changes::default()
        };
        let altered = change(&original, &changes).unwrap();
        let a = act(
            &altered,
            &[0.; INPUTS],
            &mut State::default(),
            &Config::default(),
            false,
        );
        for (actual, expected) in a.transport.into_iter().zip([0., 0.2, 0.6, 1.]) {
            assert!((actual - expected).abs() < 1e-6);
        }
        assert_eq!(original, seed());
        assert!(
            change(
                &original,
                &Changes {
                    chemotaxis: Some(4),
                    ..Changes::default()
                }
            )
            .is_err()
        );
    }
}
