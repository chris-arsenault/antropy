//! Read a retained world without stepping; quantify support and possible cutoff loss.
use antropy_engine::world::World;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args().nth(1).ok_or("Expected checkpoint")?;
    let world = World::restore(&std::fs::read(path)?)?;
    let field = &world.field;
    let area = field.spacing.powi(2);
    let total: f64 = field.amounts.iter().map(|&q| q as f64).sum();
    let maximum = world
        .chemistry
        .properties
        .iter()
        .map(|p| p.diffusion)
        .fold(0., f64::max);
    let bound =
        world.config.physiology_interval * 4. * (maximum / area + field.drift / field.spacing);
    let mut thresholds = vec![];
    for cutoff in [1e-9, 1e-8, 1e-7, 1e-6, 1e-5, 1e-4] {
        let floor = cutoff * area;
        let mut removed = 0.;
        let mut groups = 0;
        let mut nodes = 0;
        let mut values = 0;
        for row in field.amounts.chunks_exact(256) {
            let mut used = false;
            for group in row.chunks_exact(4) {
                groups += usize::from(group.iter().any(|&q| q as f64 >= floor));
                for &q in group {
                    if (q as f64) < floor {
                        removed += q as f64;
                    } else {
                        values += 1;
                        used = true;
                    }
                }
            }
            nodes += usize::from(used);
        }
        thresholds.push(serde_json::json!({
            "concentration": cutoff, "removed": removed,
            "fractionRemoved": removed / total, "groups": groups,
            "nodes": nodes, "values": values,
        }));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(&serde_json::json!({
            "tick": world.tick, "population": world.cells.len(), "fieldMaterial": total,
            "maximumDiffusion": maximum, "outgoingBound": bound, "thresholds": thresholds,
        }))?
    );
    Ok(())
}
