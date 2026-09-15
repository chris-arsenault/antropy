use antropy_engine::{
    chemical_operators::OperatorCompiler,
    composed::{Accounts, bodies::Cloud, exchange::Exchange},
    config::Config,
    genetics::Target,
    machinery_parameters::{
        EnzymeParameters, MachineryParameters, PARAMETER_VERSION, TransportParameters,
    },
    world::World,
};

#[test]
fn transposed_delivery_matches_independent_weighted_donor_allocation() {
    let mut world = World::new(
        101,
        Config {
            width: 16.,
            height: 16.,
            founders: 2,
            source_count: 0,
            ..Config::default()
        },
    )
    .unwrap();
    let center = Target { x: 5., y: 5. };
    let parameters = MachineryParameters {
        version: PARAMETER_VERSION,
        receptors: [center; 4],
        transporters: [TransportParameters { center }; 4],
        enzymes: [EnzymeParameters {
            center,
            offset: [1., 0.],
        }; 4],
        membrane: center,
    };
    let compiler = OperatorCompiler::new(&world.chemistry).unwrap();
    let operators = vec![compiler.compile_target(&parameters).unwrap(); 2];
    world.field.amounts.fill(0.);
    world.field.amounts[85] = 1.;
    world.field.amounts[256 + 85] = 0.5;
    world.field.refresh(&world.chemistry);
    for cell in &mut world.cells {
        cell.inventory.fill(0.);
        cell.energy = 10.;
        cell.body[2] = 10.;
        cell.body[7] = 100.;
        cell.action.transport = [1., 0.5, 0.5, 0.5];
    }
    let weights = [[0.75, 0.25], [0.25, 0.75]];
    let clouds = weights.map(|w| Cloud {
        weights: vec![(0, w[0]), (1, w[1])],
        profile: [0.; 2],
        mass: 1.,
    });
    let amounts = [1., 0.5];
    let area = world.field.spacing.powi(2);
    let local = weights.map(|w| (w[0] * amounts[0] + w[1] * amounts[1]) / area);
    let request = local.map(|c| world.config.dt * 100. * c / (1. + c));
    let mut expected = [0.; 2];
    for (node, amount) in amounts.iter().enumerate() {
        let demands: [f64; 2] = std::array::from_fn(|cell| {
            request[cell] * weights[cell][node] * amount / (local[cell] * area)
        });
        let total = demands.iter().sum::<f64>();
        assert!(total > *amount);
        for cell in 0..2 {
            expected[cell] += amount * demands[cell] / total;
        }
    }
    let before = super::composed::held(&world.field, &world.cells, &world.chemistry);
    let mut books = Accounts::default();
    Exchange::default().advance(
        &mut world.cells,
        &operators,
        &clouds,
        &mut world.field,
        (&world.chemistry, &world.config),
        &mut books,
    );
    for (cell, amount) in world.cells.iter().zip(expected) {
        assert!((cell.inventory[85] - amount).abs() < 1e-12);
    }
    assert_eq!(world.field.amounts[85], 0.);
    assert_eq!(world.field.amounts[256 + 85], 0.);
    super::composed::balanced(
        before,
        super::composed::held(&world.field, &world.cells, &world.chemistry),
        books,
    );
}
