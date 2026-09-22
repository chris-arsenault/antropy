use crate::{
    chemical_operators::Operators,
    chemistry::{self, Chemistry},
    config::Config,
    diagnostics,
    genetics::Enzyme,
    metabolism, transformation_work, weathering,
    world::World,
};

#[test]
fn circuit_private_returns_close_against_external_input() {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let p = &w.chemistry.properties;
    let signal = weathering::signal(std::array::from_fn(|k| {
        (p[0].interaction[k] + p[136].interaction[k]) / 2.
    }));
    let mut totals = [0.; 3];
    for (i, (s, t)) in [(0, 128), (128, 136), (136, 8), (8, 0)]
        .into_iter()
        .enumerate()
    {
        let mut cell = w.cells[0].clone();
        cell.energy = 0.;
        cell.inventory.fill(0.);
        cell.inventory.set(s, 1.);
        let from = chemistry::coordinate(s);
        let mut machinery = cell.chemistry().clone();
        machinery.enzymes = [Enzyme {
            x: from[0],
            y: from[1],
            center_x: if i % 2 == 0 { 4. } else { 0. },
            center_y: if i % 2 == 1 { 4. } else { 0. },
            angle: 0.,
        }; crate::organism::MAX_ENZYMES];
        cell.operators = Some(Operators::compile(&machinery, &w.config, &w.chemistry));
        let initial = cell.clone();
        metabolism::react_observed(&mut cell, &w.config, &w.chemistry, 1e6, true, signal);
        assert!((cell.inventory.value(t) - 1.).abs() < 1e-12);
        assert!(cell.energy > 2.);
        let [work, heat, input] = [
            cell.energy,
            cell.flows.reaction_heat,
            cell.flows.external_work,
        ];
        assert!((p[s].potential + input - p[t].potential - work - heat).abs() < 1e-12);
        assert!(heat >= 0.);
        for (total, value) in totals.iter_mut().zip([work, heat, input]) {
            *total += value;
        }
        if i == 1 || i == 2 {
            let mut unfunded = initial;
            metabolism::react(&mut unfunded, &w.config, &w.chemistry, 1e6);
            assert_eq!(unfunded.inventory.value(s), 1.);
            assert_eq!(unfunded.energy, 0.);
        }
    }
    assert!((totals[2] - 12.917249741333755).abs() < 1e-10);
    assert!((totals[0] + totals[1] - totals[2]).abs() < 1e-12);
}

#[test]
fn mixed_rows_vanish_with_identity_and_relabel_covariantly() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config::default();
    let mut m = crate::genetics::Machinery::seed(&chemistry, &chemistry.source_species());
    m.enzymes[0] = Enzyme {
        x: 7.,
        y: 7.,
        center_x: 3.2,
        center_y: 5.6,
        angle: 0.37,
    };
    let op = Operators::compile(&m, &c, &chemistry);
    for e in &op.enzymes[0].conversions {
        for signal in [[0., 0.], [0.3, -0.2], [-0.3, 0.2]] {
            let [work, heat, input] = e.energy(&c, signal);
            assert!((work + heat - e.potential_drop - input).abs() < 1e-12);
            assert!(heat >= 0. && input >= 0. && input <= c.environmental_work * e.changed / 2.);
            if signal == [0., 0.] {
                assert!((work - e.work).abs() < 1e-12);
            }
            let mut relabeled = chemistry.clone();
            for s in 0..256 {
                relabeled.properties[255 - s] = chemistry.properties[s].clone();
            }
            let products: Vec<_> = e
                .products
                .iter()
                .map(|p| crate::chemical_products::ProductWeight {
                    species: 255 - p.species,
                    weight: p.weight,
                })
                .collect();
            let a = transformation_work::coefficient(&relabeled, 255 - e.substrate, &products);
            assert_eq!(a, e.work_coefficient);
        }
    }
    let identity = [crate::chemical_products::ProductWeight {
        species: 0,
        weight: 1.,
    }];
    assert_eq!(
        transformation_work::coefficient(&chemistry, 0, &identity),
        [0.; 2]
    );
}

#[test]
fn production_external_accounts_survive_cold_continuation() {
    let mut w = crate::initial_ecology::probe(1, true).unwrap();
    for _ in 0..12 {
        w.step();
    }
    assert!(w.ledger.flows.external_work > 0.);
    let summary = crate::observation::summary(&w);
    assert!(summary["energyResidual"].as_f64().unwrap().abs() < 1e-7);
    let mut restored = crate::boundary_tests::restored_state(&w);
    let resumed_tick = w.tick + 8;
    for _ in 0..8 {
        w.step();
        restored.step();
    }
    crate::boundary_tests::usable_continuation(&w, resumed_tick);
    crate::boundary_tests::usable_continuation(&restored, resumed_tick);
}

#[test]
fn default_starts_with_four_funded_mutable_roles_in_each_colony() {
    let w = World::new(27, Config::default()).unwrap();
    w.validate().unwrap();
    assert_eq!(w.cells.len(), 48);
    assert_eq!(w.genomes.len(), 4);
    assert_eq!(w.config.source_species, [0, 136]);
    for colony in w.cells.chunks(24) {
        for role in 0..4 {
            let cells: Vec<_> = colony.iter().filter(|c| c.genome == role + 1).collect();
            assert_eq!(cells.len(), 6);
            for cell in cells {
                let input = crate::initial_ecology::CIRCUIT[role as usize];
                let output = crate::initial_ecology::CIRCUIT[(role as usize + 1) % 4];
                assert!((cell.mass() - cell.bound_material.material()).abs() < 1e-12);
                assert_eq!(
                    cell.chemistry(),
                    &w.genomes[&cell.genome].express().chemistry
                );
                assert!(cell.inventory.value(input) > 0. && cell.inventory.value(output) > 0.);
                for (slot, enzyme) in cell.operators.as_ref().unwrap().enzymes.iter().enumerate() {
                    if !cell.chemistry().programs[slot] {
                        assert!(enzyme.conversions.is_empty());
                        continue;
                    }
                    let row = enzyme
                        .conversions
                        .iter()
                        .find(|r| r.substrate == input)
                        .unwrap();
                    assert_eq!(row.products.len(), 1);
                    assert_eq!(row.products.get(0).species, output);
                    assert_eq!(row.products.get(0).weight, 1.);
                }
            }
        }
    }
    assert!(w.config.mutation_rate > 0. && w.config.physical_mutation_rate > 0.);
    let summary = crate::observation::summary(&w);
    assert_eq!(summary["materialResidual"], 0.);
    assert_eq!(summary["energyResidual"], 0.);
}
