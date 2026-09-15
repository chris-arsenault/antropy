use super::support::*;

pub fn occupancy(weighted_activities: &[f64]) -> Vec<f64> {
    let denominator = 1. + weighted_activities.iter().sum::<f64>();
    weighted_activities
        .iter()
        .map(|a| a / denominator)
        .collect()
}
pub fn tendency(engaged_capacity: f64, affinity: f64, activation: f64) -> (f64, f64) {
    let logistic = |x: f64| {
        if x >= 0. {
            1. / (1. + (-x).exp())
        } else {
            x.exp() / (1. + x.exp())
        }
    };
    let scale = engaged_capacity * (-activation).exp();
    (scale * logistic(affinity), scale * logistic(-affinity))
}
pub fn barrier(distance: f64) -> f64 {
    distance * distance / 9.
}
pub fn products(p: [f64; 2]) -> [f64; 256] {
    let mut weights = [0.; 256];
    for entry in antropy_engine::chemical_products::product_neighborhood(0, p) {
        weights[entry.species] = entry.weight;
    }
    weights
}

#[test]
fn engagement_competition_and_capacity() {
    let alone = occupancy(&[2., 0.]);
    let competition = occupancy(&[2., 8.]);
    assert!(competition[0] < alone[0]);
    assert!(competition.iter().all(|x| *x >= 0.));
    assert!(competition.iter().sum::<f64>() < 1.);
    close(occupancy(&[0., 0.]).iter().sum(), 0., 0.);
    let rates = tendency(0.5, 2., 0.7);
    close(rates.0 + rates.1, 0.5 * (-0.7_f64).exp(), 1e-14);
}

#[test]
fn reversibility_product_and_charge_feedback() {
    for affinity in [-4., -0.1, 0., 0.1, 4.] {
        let (forward, reverse) = tendency(0.8, affinity, 0.3);
        close((forward / reverse).ln(), affinity, 2e-14);
        assert!((forward - reverse) * affinity >= 0.);
    }
    // u_s-u_p=4, equal activities, nu=1: stall at mu_w=4.
    let low = tendency(1., 4. - 8. * 0.1, 0.);
    let full = tendency(1., 4. - 8., 0.);
    assert!(low.0 > low.1 && full.0 < full.1);
    let stalled = tendency(1., 0., 0.);
    close(stalled.0, stalled.1, 0.);
    let accumulated = tendency(1., 4. - 2. - 3., 0.);
    assert!(accumulated.0 < accumulated.1);
    let raised = tendency(1., 0., 5.);
    close(raised.0 / raised.1, 1., 1e-14);
    assert!(raised.0 < stalled.0);
}

#[test]
fn continuous_reflected_discrete_products() {
    for x in [0., 0.4, 3., 14.9, 15., 15.1, 30.] {
        let weights = products([x, 4.2]);
        close(weights.iter().sum(), 1., 1e-14);
        assert!(weights.iter().all(|w| *w >= 0.));
        for eps in [1e-4, 1e-6] {
            let left = products([x - eps, 4.2]);
            let right = products([x + eps, 4.2]);
            let l1: f64 = left.iter().zip(right).map(|(a, b)| (a - b).abs()).sum();
            assert!(l1 <= 4. * eps + 1e-13);
        }
    }
    close(products([15.2, 4.2])[14 * 16 + 4], 0.16, 1e-14);
}

#[test]
fn reaction_and_attraction_cycles_require_work() {
    // Distinct state energies: reservoir -> bound feed -> bound product -> released product.
    // The reaction changes interaction profile as well as chemical reference energy.
    let reference = [6., 6., 2., 2., 6.];
    let interaction = [0., -3., -0.2, 0., 0.];
    let mut total_work = 0.;
    for i in 0..4 {
        let delta = reference[i + 1] + interaction[i + 1] - reference[i] - interaction[i];
        // Dissipation fixed independently at each event, selected here as 0.1 E.
        let work = delta + 0.1;
        total_work += work;
        let (f, r) = tendency(1., work - delta, 0.4);
        assert!(f > r);
    }
    close(total_work, 0.4, 1e-14);
    // Ignoring profile work would incorrectly credit 4 E at the bound conversion.
    close((6. - 3.) - (2. - 0.2), 1.2, 1e-14);
    let z0 = 0.2;
    let z1 = z0 + 0.1;
    let captured = battery_energy(z1, 1., 8.) - battery_energy(z0, 1., 8.);
    let released = battery_energy(z0, 1., 8.) - battery_energy(z1, 1., 8.);
    close(captured + released, 0., 0.);
}

#[test]
fn conditional_direct_and_staged_capacity() {
    // Equal saturated engagement and driving force; total catalyst stock needed for unit flux.
    let direct_short = barrier(1.).exp();
    let staged_short = 2. * barrier(0.5).exp();
    assert!(direct_short < staged_short);
    let direct_long = barrier(6.).exp();
    let staged_long = 2. * barrier(3.).exp();
    assert!(direct_long > staged_long);
    // Intermediate engagement of 0.01 reverses that advantage: a real negative context.
    let scarce = 2. * barrier(3.).exp() / 0.01;
    assert!(scarce > direct_long);
    println!(
        "capacity short={direct_short:.6}/{staged_short:.6}; long={direct_long:.6}/{staged_long:.6}; scarce={scarce:.6}"
    );
}
