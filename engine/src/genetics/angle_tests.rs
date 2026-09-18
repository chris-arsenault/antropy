use super::{angles, mutation::mutate_angles};
use crate::random::Random;
use std::f64::consts::PI;

#[test]
fn circular_mutation_has_shared_magnitude_rate_and_no_seam_barrier() {
    let mut rng = Random::new(27);
    let mut changed = 0;
    let mut small = 0;
    let mut crossed = 0;
    let scale = 0.12 / 3.;
    let median = 0.6744897501960817 * scale;
    for _ in 0..20000 {
        let start = PI - 0.001;
        let mut angle = start;
        let mut repeated = start;
        let mut replay = rng.clone();
        let did_change = mutate_angles([&mut angle], &mut rng, 0.1, scale);
        assert_eq!(
            did_change,
            mutate_angles([&mut repeated], &mut replay, 0.1, scale)
        );
        assert_eq!(angle, repeated);
        assert_eq!(rng.0, replay.0);
        assert!((-PI..PI).contains(&angle));
        if did_change {
            changed += 1;
            small += usize::from(angles::difference(start, angle).abs() < median);
            crossed += usize::from(angle < 0.);
        }
    }
    assert!((1800..2200).contains(&changed));
    assert!((0.45..0.55).contains(&(small as f64 / changed as f64)));
    assert!((0.40..0.55).contains(&(crossed as f64 / changed as f64)));
    let mut angle = 0.7;
    let before = rng.0;
    assert!(!mutate_angles([&mut angle], &mut rng, 0., scale));
    assert_eq!(rng.0, before);
    assert_eq!(angle, 0.7);
    for _ in 0..100 {
        mutate_angles([&mut angle], &mut rng, 1., f64::MAX);
        assert!(angle.is_finite() && (-PI..PI).contains(&angle));
    }
}
