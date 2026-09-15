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
fn pair() -> MachineryParameters {
    let center = Target { x: 5_f64, y: 5_f64 };
    MachineryParameters {
        version: PARAMETER_VERSION,
        receptors: [center; 4],
        transporters: [TransportParameters { center }; 4],
        enzymes: [EnzymeParameters {
            center,
            offset: [1_f64, 0_f64],
        }; 4],
        membrane: center,
    }
}

#[test]
fn products_compete_and_downhill_work_can_restart_an_empty_store() {
    let w = world();
    // Choose a real downhill neighboring pair from the validated definition.
    let (substrate, product) = (0..240)
        .map(|s| (s, s + 16))
        .max_by(|(a, b), (c, d)| {
            (w.chemistry.properties[*a].potential - w.chemistry.properties[*b].potential).total_cmp(
                &(w.chemistry.properties[*c].potential - w.chemistry.properties[*d].potential),
            )
        })
        .unwrap();
    assert!(
        w.chemistry.properties[substrate].potential - w.chemistry.properties[product].potential
            > 0.1
    );
    let center = antropy_engine::chemistry::coordinate(substrate);
    let mut parameters = pair();
    parameters.enzymes = [EnzymeParameters {
        center: Target {
            x: center[0],
            y: center[1],
        },
        offset: [1., 0.],
    }; 4];
    let compiler = OperatorCompiler::new(&w.chemistry).unwrap();
    let ops = compiler.compile_target(&parameters).unwrap();
    let mut empty = w.cells[0].clone();
    empty.body[11..].fill(0.);
    empty.body[11] = 1.;
    empty.inventory.fill(0.);
    empty.inventory.set(substrate, 1.);
    empty.energy = 0.;
    let mut neutral = empty.clone();
    neutral.inventory.set((product + 128) % 256, 1.);
    let mut products = empty.clone();
    products.inventory.set(product, 1.);
    let mut work = ReactionWork::default();
    let mut books = Accounts::default();
    work.react(&mut empty, &ops, &w.config, 0.2, &mut books);
    assert!(empty.energy > 0. && empty.inventory[product] > 0.);
    work.react(&mut neutral, &ops, &w.config, 0.2, &mut Accounts::default());
    work.react(
        &mut products,
        &ops,
        &w.config,
        0.2,
        &mut Accounts::default(),
    );
    assert!(
        products.inventory[substrate] > neutral.inventory[substrate],
        "product occupancy must reduce substrate turnover"
    );
    let mut uphill = pair();
    uphill.enzymes = [EnzymeParameters {
        center: Target {
            x: center[0] + 1.,
            y: center[1],
        },
        offset: [-1., 0.],
    }; 4];
    let reverse = OperatorCompiler::new(&w.chemistry)
        .unwrap()
        .compile_target(&uphill)
        .unwrap();
    let mut unfunded = empty.clone();
    unfunded.inventory.fill(0.);
    unfunded.inventory.set(product, 1.);
    unfunded.energy = 0.;
    assert_eq!(
        work.react(
            &mut unfunded,
            &reverse,
            &w.config,
            0.2,
            &mut Accounts::default()
        ),
        0.
    );
}

fn diffuse(h: f64, dt: f64) -> f64 {
    let mut chemistry = Chemistry::new(101).unwrap();
    for p in &mut chemistry.properties {
        p.diffusion = 0.2;
        p.impedance = 0.;
    }
    let mut field = Field::new(16., 16., h);
    for i in 0..field.nx * field.ny {
        field.amounts[i * 256] = (h
            * h
            * (1. + 0.2 * (std::f64::consts::TAU * (i % field.nx) as f64 / field.nx as f64).cos()))
            as f32;
    }
    field.refresh(&chemistry);
    let mut kernel = Kernel::new(&field, &chemistry);
    kernel.drift = 0.;
    for _ in 0..(1. / dt).round() as usize {
        kernel
            .advance(&mut field, &chemistry, &[], dt, &mut Accounts::default())
            .unwrap();
    }
    let amplitude = (field.amounts[0] as f64 / (h * h) - 1.) / 0.2;
    let wave = (std::f64::consts::PI * h / 16.).sin().powi(2);
    let expected = (1. - 4. * 0.2 * dt / (h * h) * wave).powf(1. / dt);
    assert!((amplitude - expected).abs() < 4e-6);
    amplitude
}
#[test]
fn spatial_and_temporal_refinement_retain_the_selected_diffusion_response() {
    let coarse = diffuse(2., 0.2);
    let temporal = diffuse(2., 0.1);
    let spatial = diffuse(1., 0.1);
    let candidate = diffuse(4., 0.2);
    assert!((coarse - temporal).abs() < 0.001);
    assert!((coarse - spatial).abs() < 0.002);
    assert!((candidate - coarse).abs() < 0.006);
}

#[test]
fn cells_modify_shared_transport_and_contact_cannot_credit_energy() {
    let mut w = world();
    w.field.amounts.fill(0.001);
    w.field.refresh(&w.chemistry);
    let mut cell = w.cells[0].clone();
    cell.x = 6.3;
    cell.y = 7.1;
    let cloud = Cloud::new(&cell, [2., 2.], &w.field, &w.chemistry, &w.config);
    let mut without = w.field.clone();
    let mut with = w.field.clone();
    let mut a = Kernel::new(&without, &w.chemistry);
    let mut b = Kernel::new(&with, &w.chemistry);
    a.advance(
        &mut without,
        &w.chemistry,
        &[],
        0.2,
        &mut Accounts::default(),
    )
    .unwrap();
    b.advance(
        &mut with,
        &w.chemistry,
        &[cloud],
        0.2,
        &mut Accounts::default(),
    )
    .unwrap();
    assert!(
        with.amounts
            .iter()
            .zip(&without.amounts)
            .any(|(a, b)| (a - b).abs() > 1e-8)
    );
    let mut other = cell.clone();
    other.x += 0.1;
    let energy = cell.energy + other.energy;
    assert!(bodies::separate(&mut cell, &mut other, &w.config) > 0.);
    assert_eq!(energy, cell.energy + other.energy);
    assert!(
        (crate_distance(&cell, &other, &w.config)
            - cell.radius(&w.config)
            - other.radius(&w.config))
        .abs()
            < 1e-12
    );
}
fn crate_distance(
    a: &antropy_engine::organism::Cell,
    b: &antropy_engine::organism::Cell,
    c: &Config,
) -> f64 {
    antropy_engine::movement::distance([a.x, a.y], [b.x, b.y], c)
}

fn cellular_interval(dt: f64) -> [f64; 2] {
    let mut w = world();
    w.config.dt = dt;
    let mut cell = w.cells[0].clone();
    cell.inventory.fill(0.1);
    cell.energy = cell.energy_capacity(&w.config);
    let ops = OperatorCompiler::new(&w.chemistry)
        .unwrap()
        .compile_target(&pair())
        .unwrap();
    let mut work = ReactionWork::default();
    let mut books = Accounts::default();
    let mut reacted = 0.;
    for _ in 0..(1.6 / dt).round() as usize {
        reacted += work.react(&mut cell, &ops, &w.config, dt, &mut books);
    }
    assert!(reacted > 0.);
    assert!(cell.inventory.iter().all(|q| *q >= 0.));
    [reacted, cell.energy + books.heat]
}
#[test]
fn slower_physiology_integrates_equal_time_with_bounded_processing_error() {
    let fine = cellular_interval(0.2);
    let middle = cellular_interval(0.4);
    let coarse = cellular_interval(0.8);
    for candidate in [middle, coarse] {
        assert!((candidate[0] - fine[0]).abs() / fine[0] < 0.03);
        assert!((candidate[1] - fine[1]).abs() / (1. + fine[1]) < 0.01);
    }
}
#[test]
fn fused_washout_preserves_accounts_and_empty_inputs() {
    let w = world();
    let mut field = w.field.clone();
    field.amounts.fill(0.003);
    field.refresh(&w.chemistry);
    let initial = field.totals(&w.chemistry);
    let mut kernel = Kernel::new(&field, &w.chemistry);
    let mut book = Accounts::default();
    kernel
        .advance_washout(&mut field, &w.chemistry, &[], 0.2, 0.01, &mut book)
        .unwrap();
    let after = field.totals(&w.chemistry);
    assert!((initial.0 + book.boundary_material - after.0 - book.material_error).abs() < 1e-10);
    assert!((initial.1 + book.boundary_energy - after.1 - book.energy_error).abs() < 1e-10);
    assert!(book.boundary_material < 0. && book.heat == 0.);
    field.amounts.fill(0.);
    field.refresh(&w.chemistry);
    kernel
        .advance_washout(
            &mut field,
            &w.chemistry,
            &[],
            0.2,
            0.01,
            &mut Accounts::default(),
        )
        .unwrap();
    assert!(field.amounts.iter().all(|q| *q == 0.));
    for invalid in [-1., f64::NAN, f64::INFINITY] {
        assert!(
            kernel
                .advance_washout(
                    &mut field,
                    &w.chemistry,
                    &[],
                    0.2,
                    invalid,
                    &mut Accounts::default()
                )
                .is_err()
        );
        assert!(field.amounts.iter().all(|q| *q == 0.));
    }
}

#[test]
fn coupled_import_process_export_and_release_close_the_same_accounts() {
    let mut w = world();
    w.field.amounts.fill(0.01);
    w.field.refresh(&w.chemistry);
    let mut cells = vec![w.cells[0].clone()];
    cells[0].inventory.fill(0.);
    cells[0].energy = 10.;
    let ops = vec![
        OperatorCompiler::new(&w.chemistry)
            .unwrap()
            .compile_target(&pair())
            .unwrap(),
    ];
    let clouds = vec![Cloud::new(
        &cells[0],
        pair().membrane.point(),
        &w.field,
        &w.chemistry,
        &w.config,
    )];
    let before = super::composed::held(&w.field, &cells, &w.chemistry);
    let mut book = Accounts::default();
    let mut kernel = Kernel::new(&w.field, &w.chemistry);
    kernel
        .advance(&mut w.field, &w.chemistry, &clouds, 0.2, &mut book)
        .unwrap();
    let mut exchange = Exchange::default();
    cells[0].action.transport = [1.; 4];
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
    assert!(ReactionWork::default().react(&mut cells[0], &ops[0], &w.config, 0.2, &mut book) > 0.);
    cells[0].action.transport = [0.; 4];
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
    cells[0].action.transport = [0.5; 4];
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
    assert!(events::assemble(&mut cells[0], 85, 3, 0.000001, &w.chemistry, &mut book) > 0.);
    events::release(&mut cells[0], &mut w.field, &w.chemistry, &mut book);
    kernel
        .advance_washout(&mut w.field, &w.chemistry, &[], 0.2, 0.01, &mut book)
        .unwrap();
    super::composed::balanced(
        before,
        super::composed::held(&w.field, &[], &w.chemistry),
        book,
    );
}
