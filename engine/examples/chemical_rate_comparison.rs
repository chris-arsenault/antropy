//! Frozen observed-cell rate comparisons. No World stepping or checkpoint conversion.
use antropy_engine::{
    chemical_operators::{Conversion, Operators},
    chemistry::Chemistry,
    config::Config,
    organism::{Cell, ChemicalFlows},
};
use serde_json::{Value, json};

fn requests<'a>(
    cell: &Cell,
    op: &'a Operators,
    c: &Config,
    old: bool,
) -> Vec<(Conversion<'a>, f64)> {
    let mut rows = Vec::new();
    for (i, enzyme) in op.enzymes.iter().enumerate() {
        let occupancy = enzyme
            .engagement
            .iter()
            .map(|a| a.value * cell.inventory.value(a.species))
            .sum::<f64>();
        let rate =
            c.physiology_interval * c.enzyme_turnover * cell.body[11 + i] * (1. - cell.damage)
                / (c.receptor_k * cell.volume(c) + occupancy).max(1e-30);
        let installed = cell.installed.enzymes[i];
        let attenuation =
            1. / (1. + (installed.center_x.powi(2) + installed.center_y.powi(2)) / 9.);
        for e in &enzyme.conversions {
            let catalytic = if old {
                e.binding * attenuation
            } else {
                e.catalytic
            };
            rows.push((e, rate * catalytic * cell.inventory.value(e.substrate)));
        }
    }
    rows
}
fn donors(rows: &[(Conversion<'_>, f64)], cell: &Cell) -> [f64; 256] {
    let mut demand = [0.; 256];
    for (e, q) in rows {
        demand[e.substrate] += q;
    }
    std::array::from_fn(|s| {
        if demand[s] > 0. {
            (cell.inventory.value(s) / demand[s]).min(1.)
        } else {
            0.
        }
    })
}
fn fund(rows: &mut [(Conversion<'_>, f64)], energy: f64, old: bool) {
    let cost = rows.iter().map(|(e, q)| q * (-e.work).max(0.)).sum::<f64>();
    let fraction = if cost > 0. {
        (energy / cost).min(1.)
    } else {
        1.
    };
    for (e, q) in rows {
        if old || e.work < 0. {
            *q *= fraction;
        }
    }
}
fn accepted<'a>(
    cell: &Cell,
    op: &'a Operators,
    c: &Config,
    old_rates: bool,
    old_funding: bool,
) -> Vec<(Conversion<'a>, f64)> {
    let mut rows = requests(cell, op, c, old_rates);
    if !old_funding {
        fund(&mut rows, cell.energy, false);
    }
    let fraction = donors(&rows, cell);
    for (e, q) in &mut rows {
        *q *= fraction[e.substrate];
    }
    if old_funding {
        fund(&mut rows, cell.energy, true);
    }
    rows
}
fn flux(rows: &[(Conversion<'_>, f64)]) -> (Vec<f64>, Vec<f64>, f64) {
    let mut produced = vec![0.; 256];
    let mut consumed = vec![0.; 256];
    let mut work = 0.;
    for (e, q) in rows {
        consumed[e.substrate] += q * e.changed;
        work += q * e.work;
        for p in &e.products {
            if p.species != e.substrate {
                produced[p.species] += q * p.weight;
            }
        }
    }
    (produced, consumed, work)
}
fn compare(cells: &[Cell], c: &Config, chemistry: &Chemistry) -> Value {
    let mut totals = vec![(vec![0.; 256], vec![0.; 256], 0.); 4];
    let mut production_error = 0_f64;
    let mut recognizing186 = 0;
    for cell in cells {
        let op = Operators::compile(&cell.installed, c, chemistry);
        recognizing186 += usize::from(op.enzymes.iter().enumerate().any(|(i, e)| {
            cell.body[11 + i] > 0.
                && e.conversions
                    .iter()
                    .any(|r| r.substrate == 186 && r.changed > 0.)
        }));
        for (i, (old_rates, old_funding)) in
            [(true, true), (false, true), (true, false), (false, false)]
                .into_iter()
                .enumerate()
        {
            let f = flux(&accepted(cell, &op, c, old_rates, old_funding));
            if i == 3 {
                let mut live = cell.clone();
                live.operators = Some(op.clone());
                live.chemical_flows = ChemicalFlows::default();
                antropy_engine::metabolism::react(&mut live, c, chemistry, c.physiology_interval);
                for s in 0..256 {
                    production_error = production_error
                        .max((live.chemical_flows.produced.value(s) - f.0[s]).abs());
                    production_error = production_error
                        .max((live.chemical_flows.consumed.value(s) - f.1[s]).abs());
                }
                production_error = production_error.max((live.energy - cell.energy - f.2).abs());
            }
            for s in 0..256 {
                totals[i].0[s] += f.0[s];
                totals[i].1[s] += f.1[s];
            }
            totals[i].2 += f.2;
        }
    }
    assert!(production_error < 1e-10);
    let cases: Vec<_> = totals
        .into_iter()
        .enumerate()
        .map(|(i, (produced, consumed, work))| {
            let total = produced.iter().sum::<f64>();
            assert!((total - consumed.iter().sum::<f64>()).abs() < 1e-10);
            let name = ["oldBoth", "newKinetics", "newFunding", "newBoth"][i];
            json!({"name":name,
        "total":total,"produced186":produced[186],"share186":produced[186]/total,
        "consumed186":consumed[186],"netWork":work,"produced":produced,"consumed":consumed})
        })
        .collect();
    json!({"cells":cells.len(),"cellsRecognizing186":recognizing186,
        "productionMaxError":production_error,"cases":cases})
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    if antropy_engine::world::VERSION >= 25 {
        return Err("Historical displacement experiment retired: use its original commit and schema; reflection centers are not offsets.".into());
    }
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() != 3 {
        return Err("Expected definition.json, initial-cells.json, new-output.json".into());
    }
    let definition: Value = serde_json::from_slice(&std::fs::read(&args[0])?)?;
    let c: Config = serde_json::from_value(definition["config"].clone())?;
    let chemistry: Chemistry = serde_json::from_value(definition["chemistry"].clone())?;
    let frame: Value = serde_json::from_slice(&std::fs::read(&args[1])?)?;
    let cells: Vec<Cell> = frame["cells"]
        .as_array()
        .ok_or("Missing cells")?
        .iter()
        .map(|r| serde_json::from_value(r["cell"].clone()))
        .collect::<Result<_, _>>()?;
    let result = compare(&cells, &c, &chemistry);
    let file = std::fs::OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&args[2])?;
    serde_json::to_writer_pretty(file, &result)?;
    println!(
        "{}: {} frozen cells; zero World ticks",
        args[2],
        cells.len()
    );
    Ok(())
}
