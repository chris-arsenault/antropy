use crate::{
    chemical_roles::{self, Mode, Query},
    config::Config,
    world::World,
};
use serde_json::{Value, json};

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 2,
            source_count: 2,
            ..Config::default()
        },
    )
    .unwrap()
}
fn query(mode: Mode) -> Query {
    Query {
        mode,
        focus: None,
        offset: 0,
    }
}

#[test]
fn roles_count_cells_not_slots_and_color_installed_funded_machinery() {
    let mut w = world();
    let enzyme = w.cells[0].operators.as_ref().unwrap().enzymes[0].clone();
    for cell in &mut w.cells {
        cell.operators.as_mut().unwrap().enzymes = std::array::from_fn(|_| enzyme.clone());
    }
    let before = w.snapshot().unwrap();
    let summary = chemical_roles::overview(&w, &query(Mode::Supported));
    assert_eq!(summary["assigned"], 2);
    let rows = summary["rows"].as_array().unwrap();
    assert!(rows.iter().all(|r| r["cells"] == 2)); // Four duplicates still count each cell once.
    let primary = chemical_roles::primary(&w.cells[0]).unwrap();
    let role = rows
        .iter()
        .find(|r| r["input"] == primary.input && r["output"] == primary.output)
        .unwrap();
    assert_eq!(role["primary"], 2);
    assert_eq!(
        chemical_roles::color(&w.cells[0], false),
        crate::presentation::hue_rgb((primary.input as f64 * 0.618033988749895).fract())
    );
    assert_eq!(before, w.snapshot().unwrap());
    let mut body = w.cells[0].body;
    body[11..].fill(0.);
    w.cells[0].set_fixture_body(body);
    let summary = chemical_roles::overview(&w, &query(Mode::Primary));
    assert_eq!(summary["assigned"], 1);
    assert_eq!(summary["unassigned"], 1);
    assert_eq!(chemical_roles::color(&w.cells[0], true), [0.3, 0.35, 0.4]);
}

#[test]
fn mixed_routes_are_complete_pageable_and_match_the_installed_compiler() {
    let mut w = world();
    for (i, cell) in w.cells.iter_mut().enumerate() {
        let mut machinery = cell.chemistry().clone();
        for (j, enzyme) in machinery.enzymes.iter_mut().enumerate() {
            enzyme.x = 2.3 + (i + j) as f64;
            enzyme.y = 6.7;
            enzyme.center_x = 3.6;
            enzyme.center_y = 6.2;
            enzyme.angle = 0.8;
        }
        cell.operators = Some(crate::chemical_operators::Operators::compile(
            &machinery,
            &w.config,
            &w.chemistry,
        ));
    }
    let mut expected = std::collections::BTreeMap::new();
    for cell in &w.cells {
        let mut pairs = std::collections::BTreeSet::new();
        for (slot, enzyme) in cell.operators.as_ref().unwrap().enzymes.iter().enumerate() {
            if !cell.chemistry().programs[slot]
                || cell.body[crate::organism::enzyme_stock(slot)] == 0.
            {
                continue;
            }
            for edge in &enzyme.conversions {
                for p in &edge.products {
                    if p.species != edge.substrate && edge.catalytic * p.weight > 0. {
                        pairs.insert((edge.substrate, p.species));
                    }
                }
            }
        }
        for pair in pairs {
            *expected.entry(pair).or_insert(0) += 1;
        }
    }
    assert!(expected.len() > 64);
    let mut actual = std::collections::BTreeMap::new();
    for offset in (0..expected.len()).step_by(64) {
        let reply = chemical_roles::overview(
            &w,
            &Query {
                offset,
                ..query(Mode::Supported)
            },
        );
        assert!(reply.to_string().len() < 16 * 1024);
        assert_eq!(reply["pairs"], expected.len());
        for row in reply["rows"].as_array().unwrap() {
            let pair = (
                row["input"].as_u64().unwrap() as usize,
                row["output"].as_u64().unwrap() as usize,
            );
            assert!(
                actual
                    .insert(pair, row["cells"].as_u64().unwrap())
                    .is_none()
            );
        }
    }
    assert_eq!(actual, expected);
    let input = *expected.keys().next().unwrap();
    let filtered = chemical_roles::overview(
        &w,
        &Query {
            focus: Some(input.0),
            ..query(Mode::Supported)
        },
    );
    assert!(
        filtered["rows"]
            .as_array()
            .unwrap()
            .iter()
            .all(|r| r["input"] == input.0 || r["output"] == input.0)
    );
}

#[test]
fn environment_paths_come_from_the_world_operator_and_queries_preserve_continuation() {
    let mut w = world();
    let mut control = w.clone();
    for _ in 0..8 {
        let env = chemical_roles::overview(&w, &query(Mode::Environment));
        assert!(!env["rows"].as_array().unwrap().is_empty());
        for row in env["rows"].as_array().unwrap() {
            let s = row["input"].as_u64().unwrap() as usize;
            let t = row["output"].as_u64().unwrap() as usize;
            let op = w.climate.operators.as_ref().unwrap();
            let j = op.destination[s].iter().position(|to| *to == t).unwrap();
            let k = usize::from(op.coefficients[j][1][s].abs() > op.coefficients[j][0][s].abs());
            let mut signal = [0.; 2];
            signal[k] = op.coefficients[j][k][s].signum() * (1. - 1e-12);
            assert!(op.fractions(s, signal, 1.)[j] > 0.);
            assert_eq!(row["cells"], 0);
        }
        chemical_roles::overview(&w, &query(Mode::Primary));
        w.step();
        control.step();
    }
    assert_eq!(w.snapshot().unwrap(), control.snapshot().unwrap());
    let restored = World::restore(&w.snapshot().unwrap()).unwrap();
    assert_eq!(
        chemical_roles::overview(&w, &query(Mode::Supported)),
        chemical_roles::overview(&restored, &query(Mode::Supported))
    );
    w.config.weathering_rate = 0.;
    assert_eq!(
        chemical_roles::overview(&w, &query(Mode::Environment))["rows"],
        json!([])
    );
}

#[test]
fn invalid_queries_are_rejected_and_empty_populations_reconcile() {
    for value in [
        json!({"mode":"foo","focus":null,"offset":0}),
        json!({"mode":"primary","focus":256,"offset":0}),
        json!({"mode":"primary","focus":null,"offset":65537}),
    ] {
        assert!(Query::parse(&value).is_err());
    }
    let mut w = world();
    w.cells.clear();
    let result: Value = chemical_roles::overview(&w, &query(Mode::Primary));
    assert_eq!(result["population"], 0);
    assert_eq!(result["unassigned"], 0);
    assert_eq!(result["rows"], json!([]));
}
