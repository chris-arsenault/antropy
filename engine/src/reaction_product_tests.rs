use super::*;

#[test]
fn compact_products_preserve_exact_merged_maps_at_boundaries_and_identity() {
    let w = crate::world::World::new(27, crate::config::Config::default()).unwrap();
    let mut machinery = w.cells[0].installed.clone();
    for (angle, x, y) in [
        (0., 0., 0.),
        (0.37, 3.2, 9.6),
        (1.1, 0.01, 14.99),
        (3.7, 14.8, 0.3),
    ] {
        let enzyme = &mut machinery.enzymes[0];
        enzyme.angle = angle;
        enzyme.center_x = x;
        enzyme.center_y = y;
        let transform = Transform::new(*enzyme);
        let (pool, ranges) = ProductPool::compile(&transform, 0..256);
        assert!(pool.weights.len() <= 255);
        assert_eq!(std::mem::size_of::<Entry>(), 2);
        for (substrate, range) in ranges.into_iter().enumerate() {
            let expected = transform.products(substrate);
            let actual = pool.view(range);
            assert_eq!(actual, expected);
            assert!(actual.iter().all(|p| p.weight > 0.));
            assert!(
                actual
                    .iter()
                    .zip(actual.iter().skip(1))
                    .all(|(a, b)| a.species < b.species)
            );
        }
        let op = crate::chemical_operators::Operators::compile(&machinery, &w.config, &w.chemistry);
        for row in &op.enzymes[0].conversions {
            assert_eq!(row.products, transform.products(row.substrate));
        }
        check_compiled(&op.enzymes[0], &transform, &w);
    }
}

fn check_compiled(
    enzyme: &crate::chemical_operators::EnzymeOperator,
    transform: &Transform,
    w: &crate::world::World,
) {
    let mut occupancy = [0.; 256];
    let mut routes = Vec::new();
    for row in &enzyme.conversions {
        let products = transform.products(row.substrate);
        let displacement = products
            .iter()
            .map(|p| {
                p.weight
                    * crate::chemistry::distance_squared(
                        crate::chemistry::coordinate(row.substrate),
                        crate::chemistry::coordinate(p.species),
                    )
            })
            .sum();
        assert_eq!(
            row.catalytic,
            row.binding
                * crate::transformation_work::kinetic(displacement, w.config.affinity_radius)
        );
        assert_eq!(
            row.work_coefficient,
            crate::transformation_work::coefficient(&w.chemistry, row.substrate, &products)
        );
        let from = w.chemistry.properties[row.substrate].potential;
        let to = from
            + products
                .iter()
                .map(|p| p.weight * (w.chemistry.properties[p.species].potential - from))
                .sum::<f64>();
        assert_eq!(row.potential_drop, from - to);
        let changed: f64 = products
            .iter()
            .filter(|p| p.species != row.substrate)
            .map(|p| p.weight)
            .sum();
        assert_eq!(row.changed, changed);
        let (work, heat) =
            crate::chemistry::reaction_energy(from, to, w.config.conversion_efficiency);
        assert_eq!(
            (row.work, row.heat),
            (work - 0.05 * changed, heat + 0.05 * changed)
        );
        occupancy[row.substrate] += row.binding;
        for product in products {
            occupancy[product.species] += row.binding * product.weight;
            if product.species != row.substrate && row.catalytic * product.weight > 0. {
                routes.push((
                    row.substrate,
                    product.species,
                    row.catalytic * product.weight,
                ));
            }
        }
    }
    let mut actual = [0.; 256];
    for a in &enzyme.engagement {
        actual[a.species] = a.value;
    }
    assert_eq!(actual, occupancy);
    routes.sort_by(|a, b| b.2.total_cmp(&a.2).then((a.0, a.1).cmp(&(b.0, b.1))));
    assert_eq!(
        enzyme.primary.map(|r| (r.input, r.output, r.strength)),
        routes.first().copied()
    );
}

#[test]
fn shared_subset_dictionary_preserves_tiny_components_without_expanded_storage() {
    let w = crate::world::World::new(27, crate::config::Config::default()).unwrap();
    let mut enzyme = w.cells[0].installed.enzymes[0];
    enzyme.angle = 1e-12;
    enzyme.center_x = 3.2;
    enzyme.center_y = 9.6;
    let transform = Transform::new(enzyme);
    let (pool, ranges) = ProductPool::compile(&transform, 0..256);
    let payload = pool.entries.len() * std::mem::size_of::<Entry>() + pool.weights.len() * 8;
    assert!(payload < pool.entries.len() * std::mem::size_of::<ProductWeight>());
    assert!(pool.weights.iter().any(|w| *w > 0. && *w < 1e-12));
    for (s, range) in ranges.into_iter().enumerate() {
        assert_eq!(pool.view(range), transform.products(s));
    }
}
