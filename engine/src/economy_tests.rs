use crate::{
    accounting::Ledger, chemistry::Chemistry, config::Config, economy, field::Field,
    genetics::Genotype, organism::Cell, transport,
};
use std::collections::BTreeMap;

#[test]
fn analytical_imports_match_actual_exchange_with_nonbinding_funding() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config {
        source_species: vec![0, 15],
        ..Default::default()
    };
    let mut genotype = Genotype::seed(&c, &chemistry);
    // Two importers for the same substrate exercise the shared species supply cap.
    genotype.chromosomes[0].chemistry.transporters[1] =
        genotype.chromosomes[0].chemistry.transporters[0];
    genotype.compile(&c, &chemistry);
    for concentrations in [[0.03, 0.], [0., 0.1], [0.1, 0.3], [10., 10.]] {
        for source in [0, 15] {
            for t in &mut genotype.chromosomes[0].chemistry.transporters[..2] {
                t.x = (source / 16) as f64;
                t.y = (source % 16) as f64;
            }
            genotype.compile(&c, &chemistry);
            let g = genotype.compiled.as_ref().unwrap();
            let mut cell = Cell::new(1, 1, g, &c, 4., 4., 0.);
            cell.action.transport = [0.7, 0.9, 0., 0.];
            let mut field = Field::new(8., 8., c.mesh);
            for n in 0..field.nx * field.ny {
                field.amounts[n * 256] = (concentrations[0] * c.mesh * c.mesh) as f32;
                field.amounts[n * 256 + 15] = (concentrations[1] * c.mesh * c.mesh) as f32;
            }
            field.refresh(&chemistry);
            let sites = field.stencil(cell.x, cell.y);
            let local = std::array::from_fn(|s| field.sample(s, &sites));
            let expected = economy::imports(
                &c,
                &chemistry,
                g,
                &cell.body,
                cell.radius(&c),
                &local,
                cell.action.transport,
            );
            let before = cell.material();
            let genomes = BTreeMap::from([(1, genotype.clone())]);
            transport::exchange(
                std::slice::from_mut(&mut cell),
                &genomes,
                &c,
                &mut field,
                &chemistry,
                &mut Ledger::default(),
                &mut transport::Work::default(),
            );
            assert!((cell.material() - before - c.dt * expected.iter().sum::<f64>()).abs() < 1e-10);
        }
    }
}

#[test]
fn inaccessible_resource_cannot_be_fixed_by_concentration_or_importer_stock() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config {
        source_species: vec![0, 15],
        ..Default::default()
    };
    let mut g = Genotype::seed(&c, &chemistry);
    let mut local = [0.; 256];
    local[15] = 1e8;
    let a = economy::budget(
        &c,
        &chemistry,
        g.compiled.as_ref().unwrap(),
        2.,
        &local,
        1.,
        0.,
    );
    g.chromosomes[0].physical[8] = 0.12;
    g.compile(&c, &chemistry);
    let b = economy::budget(
        &c,
        &chemistry,
        g.compiled.as_ref().unwrap(),
        2.,
        &local,
        1.,
        0.,
    );
    assert!(a.maintenance_margin_upper_bound < 0.);
    assert!(b.maintenance_margin_upper_bound < 0.);
    assert!(b.import_rate / a.import_rate < 1.002);
}

#[test]
fn unused_machinery_costs_more_than_it_returns() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config {
        source_species: vec![0, 15],
        ..Default::default()
    };
    let mut g = Genotype::seed(&c, &chemistry);
    let mut local = [0.; 256];
    local[0] = 0.1;
    let a = economy::budget(
        &c,
        &chemistry,
        g.compiled.as_ref().unwrap(),
        1.,
        &local,
        0.4,
        0.5,
    );
    g.chromosomes[0].physical[8] = 0.12;
    g.compile(&c, &chemistry);
    let b = economy::budget(
        &c,
        &chemistry,
        g.compiled.as_ref().unwrap(),
        1.,
        &local,
        0.4,
        0.5,
    );
    assert_eq!(a.import_rate, b.import_rate);
    assert!(b.maintenance > a.maintenance);
    assert!(b.closure_growth_margin.unwrap() < a.closure_growth_margin.unwrap());
}

#[test]
fn selected_feedstocks_have_a_funded_growth_opportunity_without_removing_barriers() {
    for seed in [1, 2, 3, 7, 42, 101, 202, 65535] {
        let chemistry = Chemistry::new(seed).unwrap();
        let c = Config {
            source_species: chemistry.source_species(),
            ..Default::default()
        };
        let g = Genotype::seed(&c, &chemistry);
        for source in &c.source_species {
            let mut local = [0.; 256];
            local[*source] = 0.1;
            let b = economy::budget(
                &c,
                &chemistry,
                g.compiled.as_ref().unwrap(),
                2.,
                &local,
                0.4,
                0.5,
            );
            assert!(
                b.closure_growth_margin.unwrap() > 0.,
                "seed {seed}, species {source}: {b:?}"
            );
            assert!(b.closure_net_growth.unwrap() > 0.);
        }
        assert!(chemistry.coverage().iter().all(|count| *count >= 8));
    }
}

#[test]
fn terminal_closure_matches_production_reaction_and_proportional_assembly() {
    let chemistry = Chemistry::new(101).unwrap();
    let c = Config {
        source_species: vec![0, 15],
        dt: 1e-6,
        ..Default::default()
    };
    let genotype = Genotype::seed(&c, &chemistry);
    let g = genotype.compiled.as_ref().unwrap();
    let mut local = [0.; 256];
    local[0] = 0.1;
    let predicted = economy::budget(&c, &chemistry, g, 1., &local, 0.4, 0.);
    let mut cell = Cell::new(1, 1, g, &c, 4., 4., 0.);
    let enzyme_rate = 2. * c.enzyme_ratio * c.enzyme_turnover;
    let substrate =
        predicted.import_rate / (enzyme_rate + predicted.import_rate / predicted.inventory);
    cell.inventory.fill(0.);
    cell.inventory
        .set(0, substrate + predicted.import_rate * c.dt);
    cell.inventory
        .set(chemistry.decomposition, predicted.inventory - substrate);
    crate::metabolism::react(
        &mut cell,
        g,
        &c,
        &mut crate::metabolism::Work::default(),
        &mut Ledger::default(),
    );
    let (built, _) = crate::metabolism::assemble(
        &mut cell,
        &chemistry,
        &c,
        predicted.import_rate * c.dt,
        0.,
        0.,
    );
    assert!((built / c.dt - predicted.import_rate).abs() < 1e-10);
    assert!((cell.flows.captured / c.dt - predicted.closure_power.unwrap()).abs() < 1e-7);
    assert!((cell.inventory[0] - substrate).abs() < 1e-12);
    assert!((cell.material() - predicted.inventory).abs() < 1e-12);
}
