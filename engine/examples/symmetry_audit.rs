//! Direct production-operator checks; no World ticks or alternative simulation rules.
use antropy_engine::{
    chemical_operators, chemical_products,
    chemistry::{self, Chemistry, SPECIES},
    config::Config,
    diagnostics,
    field::Field,
    inventory::Inventory,
    movement, weathering,
};
use serde_json::{Value, json};

fn rotate(s: usize) -> usize {
    (15 - s % 16) * 16 + s / 16
}

fn weights(s: usize, offset: [f64; 2]) -> [f64; SPECIES] {
    let mut row = [0.; SPECIES];
    for p in chemical_products::product_neighborhood(s, offset) {
        row[p.species] += p.weight;
    }
    row
}

fn geometry(chemistry: &Chemistry) -> Value {
    let mut transformed = chemistry.clone();
    for s in 0..SPECIES {
        transformed.properties[rotate(s)] = chemistry.properties[s].clone();
    }
    // Only operator inputs are transformed; this is not a persisted chemistry definition.
    let original = weathering::Operators::new(chemistry);
    let rotated = weathering::Operators::new(&transformed);
    let mut product_error = 0_f64;
    let mut affinity_error = 0_f64;
    let mut weathering_error = 0_f64;
    let mut normalization_error = 0_f64;
    for s in 0..SPECIES {
        for [x, y] in [[0., 0.], [1.25, -2.5], [15., -15.], [3., 3.]] {
            let a = weights(s, [x, y]);
            let b = weights(rotate(s), [-y, x]);
            normalization_error = normalization_error.max((a.iter().sum::<f64>() - 1.).abs());
            for t in 0..SPECIES {
                product_error = product_error.max((a[t] - b[rotate(t)]).abs());
            }
        }
        affinity_error = affinity_error.max(
            (chemistry::affinity([2.25, 9.5], s, 3.)
                - chemistry::affinity([5.5, 2.25], rotate(s), 3.))
            .abs(),
        );
        let mut a = [0.; SPECIES];
        let mut b = [0.; SPECIES];
        for (j, fraction) in original
            .fractions(s, [0.3, -0.4], 0.7)
            .into_iter()
            .enumerate()
        {
            a[rotate(original.destination[s][j])] += fraction;
        }
        for (j, fraction) in rotated
            .fractions(rotate(s), [0.3, -0.4], 0.7)
            .into_iter()
            .enumerate()
        {
            b[rotated.destination[rotate(s)][j]] += fraction;
        }
        for t in 0..SPECIES {
            weathering_error = weathering_error.max((a[t] - b[t]).abs());
        }
    }
    assert!(product_error < 1e-12 && affinity_error < 1e-12 && weathering_error < 1e-12);
    assert!(normalization_error < 1e-12);
    let affinity_sum = |p| {
        chemistry::compile_affinity(p, 3.)
            .iter()
            .map(|a| a.value)
            .sum::<f64>()
    };
    json!({"chemicalQuarterTurnMaxErrors":{"products":product_error,
        "recognition":affinity_error,"weathering":weathering_error},
        "productNormalizationMaxError":normalization_error,
        "uniformMixtureRecognition":{"interior":affinity_sum([7.,7.]),"corner":affinity_sum([0.,0.])},
        "cornerWeatheringDestinations":original.destination[0]})
}

fn motion() -> Value {
    let axis = movement::passive([1., 0., 0.], [[1., 0., 0.], [0., 0., 0.]], 0., 1., 1.);
    let d = std::f64::consts::FRAC_1_SQRT_2;
    let diagonal = movement::passive([1., 0., 0.], [[d, 0., 0.], [d, 0., 0.]], 0., 1., 1.);
    let a = axis[0].hypot(axis[1]);
    let b = diagonal[0].hypot(diagonal[1]);
    json!({"axisSpeed":a,"diagonalSpeed":b,"diagonalRelativeLoss":1.-b/a,
        "coordinateDistanceForUnitEuclideanChange":{"axis":1.,"diagonal":d.hypot(d)},
        "distanceNote":"Euclidean chemical geometry; birth-fixed capabilities have no refitting charge"})
}

fn reflected_costs() -> Value {
    let w = diagnostics::nutrition(0.8, 2., false, false);
    let mut machinery = w.cells[0].chemistry().clone();
    let rows: Vec<_> = [3., -1.]
        .into_iter()
        .map(|dx| {
            machinery.enzymes[0] = antropy_engine::genetics::Enzyme {
                x: 14.,
                y: 7.,
                center_x: dx,
                center_y: 0.,
                angle: 0.,
            };
            let operators =
                chemical_operators::Operators::compile(&machinery, &w.config, &w.chemistry);
            let enzyme = &operators.enzymes[0];
            let edge = enzyme
                .conversions
                .iter()
                .find(|e| e.substrate == 231)
                .unwrap();
            json!({"offset":[dx,0.],"attenuation":edge.catalytic/edge.binding,"workPerUnit":edge.work,
            "products":edge.products.iter().map(|p| (p.species,p.weight)).collect::<Vec<_>>()})
        })
        .collect();
    json!({"substrate":231,"rows":rows,
        "successiveReflectedOffsets":chemistry::reflect(chemistry::reflect(14.+3.)+3.),
        "singleCombinedOffset":chemistry::reflect(14.+6.)})
}

fn spatial(chemistry: &Chemistry) -> Value {
    let mut a = Field::new(16., 16., 2.);
    let mut b = Field::new(16., 16., 2.);
    let rotate_node = |n: usize| (n % 8) * 8 + 7 - n / 8;
    for (node, species, amount) in [(0, 0, 2.), (1, 80, 3.), (9, 186, 4.), (63, 88, 1.)] {
        a.add(node, species, amount, chemistry);
        b.add(rotate_node(node), species, amount, chemistry);
    }
    let c = Config::default();
    a.advance(chemistry, 0.8, c.washout, c.diffusion_impedance);
    b.advance(chemistry, 0.8, c.washout, c.diffusion_impedance);
    let mut error = 0_f32;
    for n in 0..64 {
        for s in 0..SPECIES {
            error = error
                .max((a.amounts[n * SPECIES + s] - b.amounts[rotate_node(n) * SPECIES + s]).abs());
        }
    }
    assert!(error < 1e-6);
    json!({"geographicQuarterTurnMaxAmountError":error,"nodes":64,"operatorIntervals":1})
}

fn accounts(chemistry: &Chemistry) -> Value {
    let mut free = Inventory::from(vec![0.; SPECIES]);
    let mut bound = Inventory::from(vec![0.; SPECIES]);
    free.set(0, 2.);
    free.set(80, 1.);
    bound.set(186, 3.);
    let before: Vec<_> = (0..SPECIES)
        .map(|s| free.value(s) + bound.value(s))
        .collect();
    free.transfer_to(&mut bound, 0.7);
    free.exchange_with(&mut bound, 0.4);
    let error = (0..SPECIES)
        .map(|s| (free.value(s) + bound.value(s) - before[s]).abs())
        .fold(0., f64::max);
    free.validate().unwrap();
    bound.validate().unwrap();
    let mut reference_error = 0_f64;
    let mut shift_error = 0_f64;
    for from in [0, 80, 186, 255] {
        for to in [0, 80, 186, 255] {
            let a = chemistry.properties[from].potential;
            let b = chemistry.properties[to].potential;
            let (work, heat) = chemistry::reaction_energy(a, b, 0.8);
            let shifted = chemistry::reaction_energy(a + 10., b + 10., 0.8);
            reference_error = reference_error.max((work + heat - (a - b)).abs());
            shift_error = shift_error
                .max((work - shifted.0).abs())
                .max((heat - shifted.1).abs());
        }
    }
    assert!(error < 1e-12 && reference_error < 1e-12 && shift_error < 1e-12);
    json!({"compartmentSpeciesConservationMaxError":error,
        "reactionReferenceAccountMaxError":reference_error,"reactionReferenceShiftMaxError":shift_error})
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    if antropy_engine::world::VERSION >= 25 {
        return Err("Historical displacement experiment retired: use its original commit and schema; reflection centers are not offsets.".into());
    }
    let path = std::env::args()
        .nth(1)
        .ok_or("Usage: symmetry_audit <new-report.json>")?;
    let chemistry = Chemistry::new(101)?;
    let result = json!({"schemaVersion":1,"chemistrySeed":101,"worldTicksAdvanced":0,
        "geometry":geometry(&chemistry),"motion":motion(),"reflectedCosts":reflected_costs(),
        "spatial":spatial(&chemistry),"accounts":accounts(&chemistry)});
    let file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)?;
    serde_json::to_writer_pretty(file, &result)?;
    println!("{path}: symmetry audit, zero World ticks");
    Ok(())
}
