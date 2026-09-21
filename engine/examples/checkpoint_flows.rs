//! Read-only inspection of archived v25 flow records, including rejected checkpoints.
use antropy_engine::world::World;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Expected physical checkpoint path")?;
    let bytes = std::fs::read(path)?;
    let payload = bytes
        .strip_prefix(b"ANTROPY25\0")
        .ok_or("Expected physical v25")?;
    let world: World = postcard::from_bytes(payload)?;
    for c in &world.cells {
        for (name, values) in [
            ("imported", &c.chemical_flows.imported),
            ("exported", &c.chemical_flows.exported),
            ("consumed", &c.chemical_flows.consumed),
            ("produced", &c.chemical_flows.produced),
        ] {
            for (s, q) in values.iter().enumerate() {
                if q < 0. || !q.is_finite() {
                    println!(
                        "tick={} cell={} flow={name} species={s} value={q:e}",
                        world.tick, c.id
                    );
                }
            }
        }
    }
    Ok(())
}
