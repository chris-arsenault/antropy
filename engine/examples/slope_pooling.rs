//! Dissolved basin pooling on integrated terrain at two mesh sizes; no cells or reservoirs.
//! Usage: slope_pooling <new-report.json> [seconds]
use antropy_engine::{config::Config, world::World};
use serde_json::json;
use std::{error::Error, fs};

/// Material-weighted mean height.
fn material_height(w: &World) -> f64 {
    let height = &w.shade.geography.height;
    let (mut weighted, mut total) = (0., 0.);
    for (n, h) in height.iter().enumerate() {
        let m: f64 = w.field.amounts().row(n).iter().map(|&v| v as f64).sum();
        (weighted, total) = (weighted + m * h, total + m);
    }
    weighted / total
}

/// A half-plane front, relative to the same world without elevation resistance:
/// downhill-biased spreading lowers the material-weighted height.
fn front(mesh: f64, seconds: f64) -> Result<serde_json::Value, Box<dyn Error>> {
    let (slope, flat) = (spread(mesh, seconds, true)?, spread(mesh, seconds, false)?);
    Ok(json!({"mesh":mesh,"seconds":seconds,"downhillBias":slope - flat}))
}

fn spread(mesh: f64, seconds: f64, elevation: bool) -> Result<f64, Box<dyn Error>> {
    let mut w = world(mesh, elevation)?;
    let (nx, chemistry) = (w.field.nx, w.chemistry.clone());
    w.field.replace_material(&chemistry, |i| {
        if i % 256 == 0 && (i / 256) % nx < nx / 2 {
            0.01
        } else {
            0.
        }
    });
    antropy_engine::diagnostics::initialize(&mut w);
    let initial = material_height(&w);
    for _ in 0..(seconds / w.config.dt).round() as u64 {
        w.step();
    }
    Ok(material_height(&w) - initial)
}

fn world(mesh: f64, elevation: bool) -> Result<World, Box<dyn Error>> {
    let mut config = Config::ecology();
    (config.width, config.height, config.mesh) = (240., 180., mesh);
    config.terrain.elevation = elevation;
    (config.founders, config.source_count) = (0, 0);
    config.validate()?;
    let mut w = World::new(27, config)?;
    w.sources.clear();
    antropy_engine::source_medium::project(&mut w);
    Ok(w)
}

fn case(mesh: f64, seconds: f64) -> Result<serde_json::Value, Box<dyn Error>> {
    let mut w = world(mesh, true)?;
    // One uniform dissolved species; every departure from uniform is caused by transport.
    let chemistry = w.chemistry.clone();
    w.field
        .replace_material(&chemistry, |i| if i % 256 == 0 { 0.01 } else { 0. });
    antropy_engine::diagnostics::initialize(&mut w);
    let ticks = (seconds / w.config.dt).round() as u64;
    for _ in 0..ticks {
        w.step();
    }
    let height = &w.shade.geography.height;
    let mass: Vec<f64> = (0..height.len())
        .map(|n| w.field.amounts().row(n).iter().map(|&v| v as f64).sum())
        .collect();
    let mut order: Vec<usize> = (0..height.len()).collect();
    order.sort_by(|&a, &b| height[a].total_cmp(&height[b]));
    let decile = order.len() / 10;
    let mean = |nodes: &[usize]| nodes.iter().map(|&n| mass[n]).sum::<f64>() / nodes.len() as f64;
    let (low, high) = (mean(&order[..decile]), mean(&order[order.len() - decile..]));
    let all = mean(&order);
    let (mut lo, mut hi) = (f64::MAX, 0f64);
    for &m in &mass {
        (lo, hi) = (lo.min(m), hi.max(m));
    }
    Ok(
        json!({"mesh":mesh,"seconds":seconds,"ticks":ticks,"meanMass":all,
        "lowestDecileOverMean":low/all,"highestDecileOverMean":high/all,
        "maxOverMean":hi/all,"minOverMean":lo/all}),
    )
}

fn main() -> Result<(), Box<dyn Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Expected a new output path")?;
    let seconds: f64 = std::env::args().nth(2).map_or(Ok(200.), |s| s.parse())?;
    let report = json!({
        "uniform": [case(2., seconds)?, case(1., seconds)?],
        "front": [front(2., seconds)?, front(1., seconds)?],
    });
    println!("{report}");
    let file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)?;
    serde_json::to_writer_pretty(file, &report)?;
    Ok(())
}
