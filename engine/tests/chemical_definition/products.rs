use antropy_engine::{chemical_products::product_neighborhood, chemistry::product};

fn dense(s: usize, offset: [f64; 2]) -> [f64; 256] {
    let mut result = [0.; 256];
    for p in product_neighborhood(s, offset) {
        result[p.species] += p.weight;
    }
    result
}

#[test]
fn conservative_reflected_neighborhoods() {
    for s in 0..256 {
        for offset in [[0., 0.], [0.25, -0.75], [15., 15.], [-15., -15.]] {
            let entries = product_neighborhood(s, offset);
            assert!(entries.len() <= 4);
            assert!(entries.iter().all(|p| p.species < 256 && p.weight > 0.));
            assert!((entries.iter().map(|p| p.weight).sum::<f64>() - 1.).abs() < 2e-14);
            assert!(entries.windows(2).all(|p| p[0].species < p[1].species));
            if offset[0].fract() == 0. {
                assert_eq!(entries.len(), 1);
                assert_eq!(
                    entries[0].species,
                    product(s, offset[0] as i8, offset[1] as i8)
                );
                assert_eq!(entries[0].weight, 1.);
            }
        }
    }
    assert!((dense(0, [15.2, 4.2])[14 * 16 + 4] - 0.16).abs() < 1e-14);
}

#[test]
fn weights_are_continuous_across_grid_and_reflection_boundaries() {
    for s in [0, 119, 255] {
        for x in [-15., -0.1, 0., 0.4, 3., 14.9, 15.] {
            for eps in [1e-4, 1e-6] {
                let left = dense(s, [x - eps, 4.2]);
                let right = dense(s, [x + eps, 4.2]);
                let l1: f64 = left.iter().zip(right).map(|(a, b)| (a - b).abs()).sum();
                assert!(l1 <= 4. * eps + 1e-13, "{s}/{x}: {l1}");
            }
        }
    }
}
