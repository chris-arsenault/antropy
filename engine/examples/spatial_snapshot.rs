//! Read-only geographic reductions of an ordinary checkpoint; no simulation steps.
use antropy_engine::{source_medium, world::World};
use serde_json::json;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args().nth(1).ok_or("Expected checkpoint")?;
    let w = World::restore(&std::fs::read(path)?)?;
    let f = &w.field;
    let bin_width = 20.;
    let bx = (w.config.width / bin_width).ceil() as usize;
    let by = (w.config.height / bin_width).ceil() as usize;
    let mut mixtures = vec![vec![0.; 256]; bx * by];
    let mut total = Vec::with_capacity(f.nx * f.ny);
    let mut raw = Vec::with_capacity(f.nx * f.ny);
    let mut first = Vec::with_capacity(f.nx * f.ny);
    let mut drive = Vec::with_capacity(f.nx * f.ny);
    let mut potential = Vec::with_capacity(f.nx * f.ny);
    for (n, row) in f.amounts.chunks_exact(256).enumerate() {
        let x = (n % f.nx) as f64 * f.spacing + f.spacing / 2.;
        let y = (n / f.nx) as f64 * f.spacing + f.spacing / 2.;
        let bin = (y / bin_width) as usize * bx + (x / bin_width) as usize;
        let mut q = 0.;
        let mut energy = 0.;
        for (s, &amount) in row.iter().enumerate() {
            mixtures[bin][s] += amount as f64;
            q += amount as f64;
            energy += amount as f64 * w.chemistry.properties[s].potential;
        }
        total.push(q / f.spacing.powi(2));
        potential.push(energy / f.spacing.powi(2));
        raw.push(
            w.config
                .source_species
                .iter()
                .map(|&s| row[s] as f64)
                .sum::<f64>()
                / f.spacing.powi(2),
        );
        first.push(row[w.config.source_species[0]] as f64 / f.spacing.powi(2));
        drive.push(antropy_engine::weathering::signal(f.medium_signal(n)));
    }
    println!(
        "{}",
        json!({
            "tick": w.tick, "width": w.config.width, "height": w.config.height,
            "spacing": f.spacing, "nx": f.nx, "ny": f.ny,
            "binWidth": bin_width, "binsX": bx, "binsY": by,
            "mixtures": mixtures, "total": total, "raw": raw, "first": first,
            "potential": potential, "drive": drive,
            "sources": w.sources, "sourceResponse": source_medium::observe(&w),
            "patchCenters": w.patch_centers,
        })
    );
    Ok(())
}
