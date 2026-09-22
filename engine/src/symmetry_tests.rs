use crate::{
    chemical_operators::Operators,
    chemistry::Chemistry,
    config::Config,
    genetics::{Enzyme, Machinery},
};
use crate::{diagnostics, movement};

#[test]
fn passive_motion_rotates_without_changing_speed_or_bounds() {
    for magnitude in [0., 1e-9, 1., 1e6] {
        let expected = 0.6 * magnitude / (1. + magnitude);
        for angle in [0_f64, 0.31, std::f64::consts::FRAC_PI_4, 1.7, 3.2] {
            let direction = [angle.cos(), angle.sin()];
            let velocity = movement::passive(
                [1., 0., 0.],
                [
                    [magnitude * direction[0], 0., 0.],
                    [magnitude * direction[1], 0., 0.],
                ],
                0.,
                0.3,
                2.,
            );
            for k in 0..2 {
                assert!((velocity[k] - expected * direction[k]).abs() < 1e-12);
            }
            assert!(velocity[0].hypot(velocity[1]) <= 0.6);
        }
    }
}

#[test]
fn coincident_contacts_follow_bodies_and_permute_without_world_axis() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let run = |angle: f64, reversed: bool, identical: bool| {
        let mut cells = vec![w.cells[0].clone(), w.cells[0].clone()];
        for (i, c) in cells.iter_mut().enumerate() {
            c.id = i as u64 + 1;
            c.heading = angle + if identical { 0. } else { i as f64 * 1.2 };
            c.action = Default::default();
        }
        if reversed {
            cells.reverse();
        }
        let sites = cells
            .iter()
            .map(|c| crate::footprint::Row::from_slice(&w.field.stencil(c.x, c.y)))
            .collect::<Vec<_>>();
        movement::advance(&mut cells, &w.config, &w.field, &sites);
        cells.sort_by_key(|c| c.id);
        std::array::from_fn::<_, 2, _>(|i| [cells[i].x, cells[i].y])
    };
    let reference = run(0., false, false);
    for angle in [0_f64, 0.31, 1.7] {
        let positions = run(angle, false, false);
        let reversed = run(angle, true, false);
        assert_eq!(positions, reversed);
        for i in 0..2 {
            let [x, y] = reference[i].map(|v| v - 12.);
            let expected = [
                x * angle.cos() - y * angle.sin(),
                x * angle.sin() + y * angle.cos(),
            ];
            for k in 0..2 {
                assert!((positions[i][k] - 12. - expected[k]).abs() < 1e-12);
            }
        }
        assert_eq!(run(angle, false, true), [[12.; 2]; 2]);
    }
}

#[test]
fn equal_reflected_conversion_has_equal_catalytic_cost() {
    let chem = Chemistry::new(101).unwrap();
    let c = Config::default();
    let mut machinery = Machinery::seed(&chem, &chem.source_species());
    let results = [(13.5, 7., 0.), (7., 7.5, std::f64::consts::PI)].map(|(x, y, angle)| {
        machinery.enzymes[0] = Enzyme {
            x: 14.,
            y: 7.,
            center_x: x,
            center_y: y,
            angle,
        };
        let op = Operators::compile(&machinery, &c, &chem);
        let edge = op.enzymes[0]
            .conversions
            .iter()
            .find(|e| e.substrate == 231)
            .unwrap();
        assert_eq!(edge.products.len(), 1);
        assert_eq!(edge.products.get(0).species, 215);
        (edge.catalytic, edge.work, edge.heat)
    });
    assert_eq!(results[0], results[1]);
    assert!((results[0].0 - 0.9).abs() < 1e-12);
}

#[test]
fn weathering_has_one_rate_per_distinct_destination() {
    let chem = Chemistry::new(101).unwrap();
    let op = crate::weathering::Operators::new(&chem);
    let mut checked = 0;
    for s in 0..256 {
        for j in 0..crate::weathering::BRANCHES {
            if op.destination[s][j] == s {
                assert_eq!(
                    [op.coefficients[j][0][s], op.coefficients[j][1][s]],
                    [0.; 2]
                );
                checked += 1;
            }
        }
    }
    assert_eq!(checked, 0); // Total involutions have no outward/identity boundary branches.
    assert!(
        (crate::chemistry::compile_affinity([0., 0.], 3.)
            .iter()
            .map(|a| a.value)
            .sum::<f64>()
            - 4.209876543209877)
            .abs()
            < 1e-12
    );
}

#[test]
fn uphill_requests_cannot_veto_downhill_or_spend_same_event_work() {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    w.config.enzyme_turnover = 1e6;
    let species = |value: f64| {
        (0..256)
            .min_by(|&a, &b| {
                (w.chemistry.properties[a].potential - value)
                    .abs()
                    .total_cmp(&(w.chemistry.properties[b].potential - value).abs())
            })
            .unwrap()
    };
    let (source, low, high) = (species(4.), species(0.5), species(8.));
    let mut g = w.genomes[&1].clone();
    diagnostics::retarget(&mut g, 0, source, low);
    diagnostics::retarget(&mut g, 1, source, high);
    g.compile(&w.config, &w.chemistry);
    let initial = |energy| {
        let mut cell = w.cells[0].clone();
        cell.body[11..].fill(0.);
        cell.body[11..13].fill(0.01);
        cell.set_fixture_body(cell.body);
        cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
        cell.inventory.fill(0.);
        cell.inventory.set(source, 0.1);
        cell.energy = energy;
        cell
    };
    for energy in [0., 0.001, 1.] {
        let mut a = initial(energy);
        let mut b = a.clone();
        b.operators.as_mut().unwrap().enzymes.swap(0, 1);
        for cell in [&mut a, &mut b] {
            let value = cell.energy + 0.1 * w.chemistry.properties[source].potential;
            crate::metabolism::react(cell, &w.config, &w.chemistry, 1.);
            let after = cell.energy
                + cell
                    .inventory
                    .iter()
                    .zip(&w.chemistry.properties)
                    .map(|(q, p)| q * p.potential)
                    .sum::<f64>();
            assert!((after + cell.flows.reaction_heat - value).abs() < 1e-12);
            assert!((cell.material() - 0.1).abs() < 1e-12);
            assert!(cell.inventory.value(low) > 0.);
            if energy == 0. {
                assert_eq!(cell.inventory.value(high), 0.);
                assert!((cell.inventory.value(low) - 0.1).abs() < 1e-12);
                assert!(cell.energy > 0.);
            }
        }
        assert!((a.energy - b.energy).abs() < 1e-12);
        assert!(
            a.inventory
                .iter()
                .zip(b.inventory.iter())
                .all(|(x, y)| (x - y).abs() < 1e-12)
        );
    }
}
