use crate::{
    chemical_operators::Operators,
    chemical_products::Transform,
    chemistry::{Chemistry, coordinate},
    climate::Climate,
    config::Config,
    diagnostics,
    genetics::Enzyme,
    weathering,
};

#[test]
fn environmental_routes_use_the_same_exchange_and_reverse_with_the_medium() {
    let chemistry = Chemistry::new(101).unwrap();
    let op = weathering::Operators::new(&chemistry);
    let mut uphill = 0;
    for s in 0..256 {
        for j in 0..weathering::BRANCHES {
            let t = op.destination[s][j];
            if s == t {
                continue;
            }
            let transform = Transform::new(Enzyme::between(coordinate(s), coordinate(t)));
            assert_eq!(transform.products(s)[0].species, t);
            assert_eq!(transform.products(t)[0].species, s);
            let medium = weathering::signal([op.coefficients[j][0][s], op.coefficients[j][1][s]]);
            let reverse = (0..weathering::BRANCHES)
                .find(|&k| op.destination[t][k] == s)
                .unwrap();
            let forward = op.fractions(s, medium, 1.)[j];
            let available = op.local(s, j, medium);
            assert_eq!(forward > 0., available.0 > 0.);
            assert_eq!(op.fractions(s, medium.map(|v| -v), 1.)[j], 0.);
            let reversed = medium.map(|v| -v);
            assert_eq!(
                op.fractions(t, reversed, 1.)[reverse] > 0.,
                op.local(t, reverse, reversed).0 > 0.
            );
            // Competing branches can change donor shares, not the reversed edge coefficient.
            for k in 0..2 {
                assert_eq!(op.coefficients[j][k][s], -op.coefficients[reverse][k][t]);
            }
            uphill += usize::from(op.work[j][s] > 0.);
        }
    }
    assert_eq!(uphill, 256 * weathering::BRANCHES / 2);
}

#[test]
fn external_work_is_bounded_and_field_and_reservoir_use_identical_coefficients() {
    let chemistry = Chemistry::new(101).unwrap();
    let config = Config {
        weathering_rate: 0.5,
        habitat_feedback: false,
        ..Default::default()
    };
    let op = weathering::Operators::new(&chemistry);
    for medium in [[0., 0.], [10., -5.], [-5., 10.]] {
        for dt in [0., 0.2, 2., 100.] {
            let mut row = [0.; 256];
            for s in [0, 15, 80, 138, 186, 240, 255] {
                row[s] = 2.;
            }
            let mut field = row.map(|v| v as f32);
            let mask = crate::field_activity::mask(&field);
            let mut climate = Climate::new(&config, &chemistry);
            climate.prepare(&config);
            let final_mask = climate.convert(&mut field, mask, (medium, 0.), dt);
            let signal = weathering::signal(medium);
            let accounts = op.inventory(&mut row, signal, config.weathering_rate * dt);
            for (a, b) in row.iter().zip(field) {
                assert!((a - b as f64).abs() < 3e-7);
            }
            assert!((accounts[1] - climate.heat).abs() < 1e-12);
            assert!((accounts[2] - climate.work).abs() < 1e-12);
            assert_eq!(final_mask, crate::field_activity::mask(&field));
            let bound = 14. * config.environmental_work / 2.
                * (2. * config.weathering_rate * dt * weathering::strength(signal)).min(1.);
            assert!(accounts[2] <= bound + 1e-12);
            assert!(row.iter().all(|v| *v >= 0.));
            assert!((row.iter().sum::<f64>() - 14.).abs() < 1e-12);
        }
    }
}

#[test]
fn a_funded_environmental_return_can_feed_an_ordinary_cell_without_creating_work() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let chemistry = &w.chemistry;
    let op = weathering::Operators::new(chemistry);
    let low = (0..256)
        .min_by(|&a, &b| {
            chemistry.properties[a]
                .potential
                .total_cmp(&chemistry.properties[b].potential)
        })
        .unwrap();
    let j = (0..weathering::BRANCHES)
        .max_by(|&a, &b| op.work[a][low].total_cmp(&op.work[b][low]))
        .unwrap();
    let high = op.destination[low][j];
    let medium = weathering::signal([
        1000. * op.coefficients[j][0][low],
        1000. * op.coefficients[j][1][low],
    ]);
    let mut row = [0.; 256];
    row[low] = 1.;
    let environment = op.inventory(&mut row, medium, 10.);
    assert!(environment[2] > 0. && row[high] > 0.);
    let before = row[low];
    let mut cell = w.cells[0].clone();
    cell.energy = 0.;
    cell.inventory = row.into_iter().collect();
    cell.installed.enzymes =
        [Enzyme::between(coordinate(high), coordinate(low)); crate::organism::MAX_ENZYMES];
    cell.operators = Some(Operators::compile(&cell.installed, &w.config, chemistry));
    crate::metabolism::react(&mut cell, &w.config, chemistry, 1e6);
    assert!(cell.energy > 0. && cell.inventory[low] > before);
    let stored: f64 = cell
        .inventory
        .iter()
        .zip(&chemistry.properties)
        .map(|(q, p)| q * p.potential)
        .sum();
    let residual = chemistry.properties[low].potential + environment[2]
        - environment[1]
        - stored
        - cell.energy
        - cell.flows.reaction_heat;
    assert!(residual.abs() < 1e-12);
    assert!(cell.energy < environment[2]);
    println!(
        "environment {low}>{high}, ordinary cell reverse: external_work={} captured={} residual={residual}",
        environment[2], cell.energy
    );
}
