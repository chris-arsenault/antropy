use super::*;
use crate::chemical_operators::{Conversions, product_storage::ProductPool, rows::CompiledRow};
use crate::chemical_products::ProductWeight;
use std::sync::Arc;

fn fixture(relabel: impl Fn(usize) -> usize) -> Conversions {
    let terms = [
        vec![(0, 1. - 1e-16), (1, 1e-16)],
        vec![(0, 0.25), (1, 0.25), (2, 0.5)],
        vec![(0, 0.25), (2, 0.75)],
    ];
    let products: Vec<Vec<ProductWeight>> = terms
        .iter()
        .map(|row| {
            row.iter()
                .map(|&(s, weight)| ProductWeight {
                    species: relabel(s),
                    weight,
                })
                .collect()
        })
        .collect();
    let (pool, ranges) = ProductPool::from_products(&products);
    Conversions::new(
        terms
            .into_iter()
            .enumerate()
            .zip(ranges)
            .map(|((s, products), range)| CompiledRow {
                substrate: relabel(s),
                products: range,
                binding: 1.,
                catalytic: 0.5 + s as f64,
                changed: products.iter().filter(|p| p.0 != s).map(|p| p.1).sum(),
                work: 0.,
                heat: 0.,
                potential_drop: if s == 1 { -0.7 } else { 0.3 },
                work_coefficient: [0.2 * s as f64 - 0.1, 0.15],
            })
            .collect(),
        Arc::new(pool),
    )
}

#[test]
fn numerical_pairs_match_borrowed_row_law_and_odd_padding_is_inert() {
    let rows = fixture(|s| s);
    assert_eq!(rows.len(), 3);
    let c = Config::default();
    for mixture in [[0., 0.], [0.7, -0.9], [-0.8, 0.2]] {
        for signal in [[0., 0.], [0.3, -0.2], [-0.3, 0.2]] {
            for (pair, batch) in rows.batches().iter().enumerate() {
                let actual = batch.evaluate(1.3, mixture, signal, &c);
                for lane in 0..2 {
                    let index = pair * 2 + lane;
                    if index == rows.len() {
                        assert_eq!(actual.rates[lane], 0.);
                        assert_eq!(actual.energy[lane], [0.; 3]);
                        continue;
                    }
                    let row = rows.get(index);
                    let rate = 1.3
                        * row.catalytic
                        * crate::metabolism::response(row.work_coefficient, mixture);
                    assert!((actual.rates[lane] - rate).abs() < 1e-13);
                    for (a, b) in actual.energy[lane].iter().zip(row.energy(&c, signal)) {
                        assert!((a - b).abs() < 1e-12);
                    }
                }
            }
        }
    }
}

#[test]
fn shared_product_views_preserve_self_weights_and_chemical_relabeling() {
    let amounts = [0.7, 0., 0.3];
    let original = fixture(|s| s);
    for relabel in [false, true] {
        let map = |s| if relabel { (73 * s + 19) % 256 } else { s };
        let rows = fixture(map);
        let mut expected = [0.; 256];
        for (row, amount) in original.iter().zip(amounts) {
            for p in row.products.iter().filter(|p| p.species != row.substrate) {
                expected[map(p.species)] += amount * p.weight;
            }
        }
        let mut actual = [0.; 256];
        for (row, amount) in rows.iter().zip(amounts) {
            for p in row.products.iter().filter(|p| p.species != row.substrate) {
                actual[p.species] += amount * p.weight;
            }
        }
        assert_eq!(actual, expected);
        assert!((actual[map(1)] - 0.7e-16).abs() <= f64::EPSILON * 0.7e-16);
    }
}
