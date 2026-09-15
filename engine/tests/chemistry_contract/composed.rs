use antropy_engine::{
    chemical_operators::OperatorCompiler,
    chemistry::Chemistry,
    composed::{
        Accounts,
        bodies::{self, Cloud},
        events,
        exchange::Exchange,
        field::Kernel,
        machinery::ReactionWork,
    },
    config::Config,
    field::Field,
    genetics::Target,
    machinery_parameters::{
        EnzymeParameters, MachineryParameters, PARAMETER_VERSION, TransportParameters,
    },
    organism::Cell,
    world::World,
};

fn world() -> World {
    World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 1,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap()
}
fn instructions() -> MachineryParameters {
    let center = Target {
        x: 5.25_f64,
        y: 6.5_f64,
    };
    MachineryParameters {
        version: PARAMETER_VERSION,
        receptors: [center; 4],
        transporters: [TransportParameters { center }; 4],
        enzymes: [EnzymeParameters {
            center,
            offset: [2.5_f64, -1.25_f64],
        }; 4],
        membrane: center,
    }
}
pub(super) fn held(field: &Field, cells: &[Cell], chemistry: &Chemistry) -> (f64, f64) {
    let mut total = (0., 0.);
    for node in field.amounts.chunks_exact(256) {
        for (q, p) in node.iter().zip(&chemistry.properties) {
            total.0 += *q as f64;
            total.1 += *q as f64 * p.potential;
        }
    }
    for c in cells {
        total.0 += c.mass() + c.material();
        total.1 += c.energy
            + c.mass() * chemistry.properties[chemistry.decomposition].potential
            + c.inventory
                .iter()
                .zip(&chemistry.properties)
                .map(|(q, p)| q * p.potential)
                .sum::<f64>();
    }
    total
}
pub(super) fn balanced(before: (f64, f64), after: (f64, f64), book: Accounts) {
    assert!(
        (before.0 + book.boundary_material - after.0 - book.material_error).abs()
            < 2e-9 * (1. + before.0)
    );
    assert!(
        (before.1 + book.boundary_energy - after.1 - book.heat - book.energy_error).abs()
            < 2e-9 * (1. + before.1)
    );
    assert!(book.heat >= 0.);
}

#[test]
fn composed_diffusion_has_known_local_stencil_and_conserves_tiny_channels() {
    let w = world();
    let mut chemistry = w.chemistry;
    for p in &mut chemistry.properties {
        p.diffusion = 0.2;
        p.impedance = 0.;
    }
    let mut field = w.field;
    field.amounts.fill(0.);
    field.amounts[27 * 256] = 1.;
    field.amounts[27 * 256 + 1] = 1e-30;
    field.refresh(&chemistry);
    let before = held(&field, &[], &chemistry);
    let mut kernel = Kernel::new(&field, &chemistry);
    kernel.drift = 0.;
    let mut book = Accounts::default();
    assert_eq!(
        kernel
            .advance(&mut field, &chemistry, &[], 0.2, &mut book)
            .unwrap(),
        1
    );
    assert!((field.amounts[27 * 256] as f64 - 0.96).abs() < 1e-7);
    for i in [26, 28, 19, 35] {
        assert!((field.amounts[i * 256] as f64 - 0.01).abs() < 1e-8);
    }
    assert!(field.amounts[28 * 256 + 1] > 0.);
    assert_eq!(field.amounts[0], 0.);
    balanced(before, held(&field, &[], &chemistry), book);
}

#[test]
fn composed_drift_is_directional_bounded_and_periodic() {
    let w = world();
    let mut field = w.field;
    let mut chemistry = w.chemistry;
    for p in &mut chemistry.properties {
        p.diffusion = 0.;
        p.impedance = 0.;
        p.interaction = [0.; 2];
    }
    chemistry.properties[0].interaction = [1., 0.];
    field.amounts.fill(0.);
    field.amounts[0] = 1.;
    field.amounts[256] = 2.;
    field.refresh(&chemistry);
    let before = held(&field, &[], &chemistry);
    let mut kernel = Kernel::new(&field, &chemistry);
    let mut book = Accounts::default();
    kernel
        .advance(&mut field, &chemistry, &[], 0.2, &mut book)
        .unwrap();
    // Shared difference = (2-1)/4, bounded by 1+0.25; one directed rate 0.25/2*0.2.
    assert!((field.amounts[0] as f64 - 0.995).abs() < 1e-7);
    assert!((field.amounts[256] as f64 - 2.005).abs() < 2.005 * f32::EPSILON as f64);

    balanced(before, held(&field, &[], &chemistry), book);
    let mut translated = Field::new(16., 16., 2.);
    translated.amounts[7 * 256] = 1.;
    translated.amounts[0] = 2.;
    translated.refresh(&chemistry);
    let mut k = Kernel::new(&translated, &chemistry);
    k.advance(
        &mut translated,
        &chemistry,
        &[],
        0.2,
        &mut Accounts::default(),
    )
    .unwrap();
    assert_eq!(translated.amounts[7 * 256], field.amounts[0]);
}

#[test]
fn cloud_has_no_self_propulsion_and_medium_changes_paid_motion() {
    let mut w = world();
    w.field.amounts.fill(0.);
    w.field.refresh(&w.chemistry);
    let cell = &mut w.cells[0];
    cell.x = 3.3;
    cell.y = 6.7;
    let cloud = Cloud::new(cell, [2.1, 11.2], &w.field, &w.chemistry, &w.config);
    assert!((cloud.weights.iter().map(|v| v.1).sum::<f64>() - 1.).abs() < 1e-14);
    assert!(cloud.weights.len() <= 20);
    let mut kernel = Kernel::new(&w.field, &w.chemistry);
    kernel.refresh(&w.field, std::slice::from_ref(&cloud));
    assert!(
        kernel
            .gradient(&w.field, &cloud)
            .iter()
            .flatten()
            .all(|v| v.abs() < 1e-13)
    );
    let mut a = cell.clone();
    let mut b = cell.clone();
    let mut books = Accounts::default();
    let (passive, fast) = bodies::motion(
        &mut a,
        &cloud,
        &w.field,
        &kernel,
        [0.1, 0.],
        0.2,
        &mut books,
    );
    assert!(passive[0].abs() < 1e-12);
    assert!(books.heat > 0.);
    kernel.resistance.fill(5.);
    let (_, slow) = bodies::motion(
        &mut b,
        &cloud,
        &w.field,
        &kernel,
        [0.1, 0.],
        0.2,
        &mut Accounts::default(),
    );
    assert!((fast[0] / slow[0] - 5.).abs() < 1e-10);
    let mut empty = cell.clone();
    empty.energy = 0.;
    let (_, motor) = bodies::motion(
        &mut empty,
        &cloud,
        &w.field,
        &kernel,
        [10., 0.],
        0.2,
        &mut Accounts::default(),
    );
    assert_eq!(motor, [0.; 2]);
}

#[test]
fn shared_cell_donors_conserve_and_exhausted_work_prevents_transport() {
    let mut w = world();
    w.field.amounts.fill(0.);
    w.field.amounts[27 * 256 + 86] = 0.001;
    w.field.refresh(&w.chemistry);
    let mut a = w.cells[0].clone();
    a.x = 7.;
    a.y = 7.;
    a.inventory.fill(0.);
    a.body[2] = 10.;
    a.body[7..11].fill(100.);
    a.action.transport = [1.; 4];
    a.energy = 10.;
    let mut cells = vec![a.clone(), a];
    let p = instructions();
    let compiler = OperatorCompiler::new(&w.chemistry).unwrap();
    let ops = vec![
        compiler.compile_target(&p).unwrap(),
        compiler.compile_target(&p).unwrap(),
    ];
    let clouds = cells
        .iter()
        .map(|c| Cloud::new(c, p.membrane.point(), &w.field, &w.chemistry, &w.config))
        .collect::<Vec<_>>();
    let before = held(&w.field, &cells, &w.chemistry);
    let mut book = Accounts::default();
    let mut exchange = Exchange::default();
    assert!(
        exchange.advance(
            &mut cells,
            &ops,
            &clouds,
            &mut w.field,
            (&w.chemistry, &w.config),
            &mut book
        ) > 0.
    );
    assert!((cells[0].inventory[86] - cells[1].inventory[86]).abs() < 1e-12);
    balanced(before, held(&w.field, &cells, &w.chemistry), book);
    for c in &mut cells {
        c.energy = 0.;
    }
    assert_eq!(
        exchange.advance(
            &mut cells,
            &ops,
            &clouds,
            &mut w.field,
            (&w.chemistry, &w.config),
            &mut book
        ),
        0.
    );
}

#[test]
fn finite_processing_feedback_and_nearby_parameters_change_continuously() {
    let w = world();
    let p = instructions();
    let ops = OperatorCompiler::new(&w.chemistry)
        .unwrap()
        .compile_target(&p)
        .unwrap();
    let mut cell = w.cells[0].clone();
    cell.inventory.fill(1.);
    cell.energy = 10.;
    let mut nearby = p.clone();
    nearby.enzymes[0].offset[0] += 1e-6;
    let adjacent = OperatorCompiler::new(&w.chemistry)
        .unwrap()
        .compile_target(&nearby)
        .unwrap();
    let mut other = cell.clone();
    let before = held(&w.field, std::slice::from_ref(&cell), &w.chemistry);
    let mut book = Accounts::default();
    let mut work = ReactionWork::default();
    let amount = work.react(&mut cell, &ops, &w.config, 0.2, &mut book);
    work.react(
        &mut other,
        &adjacent,
        &w.config,
        0.2,
        &mut Accounts::default(),
    );
    assert!(amount > 0. && amount <= 0.2 * cell.body[11..15].iter().sum::<f64>());
    assert!(
        cell.inventory
            .iter()
            .zip(other.inventory.iter())
            .map(|(a, b)| (a - b).abs())
            .sum::<f64>()
            < 1e-6
    );
    balanced(
        before,
        held(&w.field, std::slice::from_ref(&cell), &w.chemistry),
        book,
    );
    cell.body[11..15].fill(0.);
    assert_eq!(work.react(&mut cell, &ops, &w.config, 0.2, &mut book), 0.);
}

#[test]
fn paid_lifecycle_and_field_sequence_closes_and_birth_preserves_damage() {
    let mut w = world();
    let mut cell = w.cells[0].clone();
    cell.inventory.fill(0.1);
    cell.energy = 10.;
    cell.damage = 0.4;
    let before = held(&w.field, std::slice::from_ref(&cell), &w.chemistry);
    let mut book = Accounts::default();
    assert!(events::assemble(&mut cell, 20, 3, 0.02, &w.chemistry, &mut book) > 0.);
    let mut actual = [5., 6.];
    assert!(events::remodel(&mut cell, &mut actual, [7., 6.], 3, 0.1, &mut book) > 0.);
    assert!(events::repair(&mut cell, 30, 0.01, &mut w.field, &w.chemistry, &mut book) > 0.);
    events::spend(&mut cell, 0.01, &mut book);
    let damage = cell.damage;
    let mut child = events::split_material(&mut cell, &mut book).unwrap();
    assert_eq!(child.damage, damage);
    assert_eq!(cell.damage, damage);
    events::release(&mut child, &mut w.field, &w.chemistry, &mut book);
    events::release(&mut cell, &mut w.field, &w.chemistry, &mut book);
    let mut kernel = Kernel::new(&w.field, &w.chemistry);
    kernel
        .advance(&mut w.field, &w.chemistry, &[], 0.2, &mut book)
        .unwrap();
    events::washout(&mut w.field, &w.chemistry, 0.01, 0.2, &mut book);
    balanced(before, held(&w.field, &[], &w.chemistry), book);
}

#[test]
fn refit_subdivision_cannot_evade_price_and_unfunded_birth_is_rejected() {
    let w = world();
    let mut a = w.cells[0].clone();
    let mut b = a.clone();
    let (mut p, mut q) = ([5., 5.], [5., 5.]);
    let mut book = Accounts::default();
    events::remodel(&mut a, &mut p, [6., 5.], 3, 1., &mut book);
    for _ in 0..10 {
        events::remodel(&mut b, &mut q, [6., 5.], 3, 0.1, &mut book);
    }
    assert!((a.energy - b.energy).abs() < 1e-13);
    assert!((p[0] - q[0]).abs() < 1e-13);
    b.energy = 0.;
    let material = b.mass() + b.material();
    assert!(events::split_material(&mut b, &mut book).is_none());
    assert_eq!(b.mass() + b.material(), material);
}

#[test]
fn internal_and_external_exposure_both_cause_injury_and_repair_is_funded() {
    let mut w = world();
    let mut a = w.cells[0].clone();
    a.damage = 0.;
    a.inventory.fill(0.);
    let cloud = Cloud::new(&a, [5., 5.], &w.field, &w.chemistry, &w.config);
    w.field.amounts.fill(0.);
    w.field.refresh(&w.chemistry);
    assert_eq!(
        events::injure(&mut a, [5., 5.], &cloud, &w.field, &w.chemistry, &w.config),
        0.
    );
    a.inventory.fill(0.1);
    assert!(events::injure(&mut a, [5., 5.], &cloud, &w.field, &w.chemistry, &w.config) > 0.);
    a.inventory.fill(0.);
    w.field.amounts.fill(0.01);
    w.field.refresh(&w.chemistry);
    assert!(events::injure(&mut a, [5., 5.], &cloud, &w.field, &w.chemistry, &w.config) > 0.);
    let damage = a.damage;
    a.energy = 0.;
    assert_eq!(
        events::repair(
            &mut a,
            0,
            1.,
            &mut w.field,
            &w.chemistry,
            &mut Accounts::default()
        ),
        0.
    );
    assert_eq!(damage, a.damage);
}
