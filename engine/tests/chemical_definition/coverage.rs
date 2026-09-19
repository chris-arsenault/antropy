use super::profiles::SEEDS;
use antropy_engine::{
    chemical_products::product_neighborhood,
    chemical_profiles::ProfileCoverage,
    chemistry::{Chemistry, affinity, coordinate, product},
};

#[test]
fn degenerate_preferences_fail_the_coverage_predicate() {
    let mut c = Chemistry::new(101).unwrap();
    for p in &mut c.properties {
        p.interaction = [0.; 2];
    }
    assert!(ProfileCoverage::measure(&c.properties).validate().is_err());
    c = Chemistry::new(101).unwrap();
    c.profiles.coefficients[1] = c.profiles.coefficients[0];
    for (s, p) in c.properties.iter_mut().enumerate() {
        p.interaction = c.profiles.evaluate(coordinate(s));
    }
    assert!(c.validate().unwrap_err().contains("rank"));
    // Two independent, exclusively positive surfaces retain rank but lose sign quadrants.
    c = Chemistry::new(101).unwrap();
    c.profiles.coefficients = [[0.; 16]; 2];
    c.profiles.coefficients[0][0] = 1.;
    c.profiles.coefficients[0][4] = 1.;
    c.profiles.coefficients[1][0] = 1.;
    c.profiles.coefficients[1][1] = 1.;
    for (s, p) in c.properties.iter_mut().enumerate() {
        p.interaction = c.profiles.evaluate(coordinate(s));
    }
    assert!(c.validate().unwrap_err().contains("quadrant"));
}

#[test]
fn declared_seeds_cover_physical_combinations_and_profile_rank() {
    for seed in SEEDS {
        let c = Chemistry::new(seed).unwrap();
        let q = ProfileCoverage::measure(&c.properties);
        q.validate().unwrap();
        assert!(q.quadrants.iter().all(|ids| ids.len() >= 8));
        assert!(q.minimum_eigenvalue >= 0.05);
        assert!(q.maximum_normalized_step <= 0.15);
        let physical = c.physical_coverage();
        assert_eq!(
            physical.witnesses.each_ref().map(|ids| ids.len()),
            c.coverage()
        );
        assert!(physical.witnesses.iter().all(|ids| ids.len() >= 8));
        assert!(physical.affinity_weighted_barriers.len() >= 8);
        assert!(physical.largest_barrier_component >= 4);
        println!(
            "seed={seed} quadrants={:?} lambda_min={:.9} max_step={:.9} physical={:?} neighborhoods={} component={}",
            q.quadrants.each_ref().map(|v| v.len()),
            q.minimum_eigenvalue,
            q.maximum_normalized_step,
            c.coverage(),
            physical.affinity_weighted_barriers.len(),
            physical.largest_barrier_component
        );
    }
}

#[test]
fn every_adjacent_transformation_is_accessible_and_the_graph_is_connected() {
    let mut seen = [false; 256];
    let mut queue = vec![0];
    while let Some(s) = queue.pop() {
        if seen[s] {
            continue;
        }
        seen[s] = true;
        assert_eq!(affinity(coordinate(s), s, 3.), 1.);
        for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
            let t = product(s, dx, dy);
            let p = product_neighborhood(s, [dx as f64, dy as f64]);
            assert_eq!(p.len(), 1);
            assert_eq!((p[0].species, p[0].weight), (t, 1.));
            queue.push(t);
        }
    }
    assert!(seen.into_iter().all(|v| v));
}

#[test]
fn potential_has_multiple_basins_and_no_globally_privileged_axis() {
    for seed in SEEDS {
        let mut c = Chemistry::new(seed).unwrap();
        let t = antropy_engine::chemical_landscape::topology(&c.properties);
        println!("seed={seed} topology={t:?}");
        assert!(t.rising.into_iter().chain(t.falling).all(|n| n >= 60));
        assert!(t.minima >= 2 && t.maxima >= 2);
        // A smooth axial gradient satisfies the old range/coverage idea but fails geometry.
        for (s, p) in c.properties.iter_mut().enumerate() {
            p.potential = 8. - 0.5 * (s / 16) as f64;
        }
        assert!(antropy_engine::chemical_landscape::validate(&c.properties).is_err());
    }
}
