//! Compare ordinary public chemistry with its existing scalar operator at zero skip floor.
use antropy_engine::{
    climate::Climate, footprint, reaction_medium::Medium, weathering, world::World,
};
use serde_json::{Value, json};

fn reference(
    w: &World,
    operators: &weathering::Operators,
    n: usize,
    raw: [f64; 2],
    load: f64,
    light: f64,
) -> ([f64; 3], f64) {
    let (original, mask, _) = w.field.amounts().site(n);
    let mut row: Vec<f64> = original.iter().map(|&q| q as f64).collect();
    let value = |row: &[f64]| {
        row.iter()
            .zip(&w.chemistry.properties)
            .map(|(q, p)| q * p.potential)
            .sum::<f64>()
    };
    let energy = value(&row);
    let material: f64 = row.iter().sum();
    let exposure = weathering::exposure(
        1.,
        load,
        w.config.habitat_feedback,
        w.config.diffusion_impedance,
    );
    let result = operators
        .inventory_active(
            &mut row,
            Medium::illuminated(weathering::signal(raw), light),
            w.config.weathering_rate * w.config.physiology_interval * exposure,
            0.,
            mask,
        )
        .0;
    let residual = (value(&row) + result[1] - energy - result[2])
        .abs()
        .max((row.iter().sum::<f64>() - material).abs());
    (result, residual)
}

pub fn inspect(w: &World) -> Value {
    let mut bodies = vec![[0.; 2]; w.field.nx * w.field.ny];
    footprint::visit_current(w, |n, p| {
        for (a, b) in bodies[n].iter_mut().zip(p) {
            *a += b;
        }
    });
    let mut climate = Climate::new(&w.config, &w.chemistry);
    climate.prepare(&w.config);
    let operators = weathering::Operators::with_radius(
        &w.chemistry,
        w.config.environmental_work,
        w.config.affinity_radius,
    );
    let dt = w.config.physiology_interval;
    let mut exact = [0.; 3];
    let mut occupied = 0;
    let mut skipped = 0;
    let mut capable = 0;
    let mut maximum_residual: f64 = 0.;
    let mut locations = [[0.; 4]; 2];
    for (n, original) in w.field.amounts().rows() {
        occupied += 1;
        let material = w.field.material_signal(n);
        let source = w.field.source_signal()[n];
        let raw = std::array::from_fn(|k| material[k] + source[k] + bodies[n][k]);
        let load = w.field.impedance_at(n) + w.field.source_load()[n];
        let light = w.field.illumination.solar(n);
        let mut actual = original.to_vec();
        let mask = w.field.amounts().site(n).1;
        let before = climate.converted;
        climate.convert_lit(&mut actual, mask, (raw, load), dt, light);
        let (result, residual) = reference(w, &operators, n, raw, load, light);
        maximum_residual = maximum_residual.max(residual);
        if result[0] > 0. {
            capable += 1;
            if climate.converted == before {
                skipped += 1;
            }
        }
        let group = &mut locations[usize::from(bodies[n] != [0.; 2])];
        group[0] += 1.;
        group[1] += f64::from(result[0] > 0. && climate.converted == before);
        group[2] += climate.converted - before;
        group[3] += result[0];
        assert!(climate.converted - before <= result[0] + 1e-12);
        for (a, b) in exact.iter_mut().zip(result) {
            *a += b;
        }
    }
    json!({"tick":w.tick,"seconds":dt,"occupiedNodes":occupied,
        "chemicallyActiveNodesWithoutSkip":capable,"entirelySkippedNodes":skipped,
        "ordinaryConverted":climate.converted,"withoutSkipConverted":exact[0],
        "ordinaryWork":climate.work,"withoutSkipWork":exact[2],
        "maximumReferenceResidual":maximum_residual,
        "locations":locations,"locationOrder":["outsideBodyFootprints","insideBodyFootprints"],
        "locationColumns":["occupiedNodes","entirelySkippedNodes","ordinaryConverted","withoutSkipConverted"],
        "meaning":"One frozen public interval with identical medium, sunlight, kinetics and substrates. Existing scalar operator removes participation and product pruning floors; no world stepping or survival inference."})
}
