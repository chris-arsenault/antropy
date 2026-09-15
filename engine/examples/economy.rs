//! Generate a local analytical report; no world ticks or ecological campaign.
use antropy_engine::{config::Config, economy};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.is_empty() || args.len() > 2 {
        return Err("Usage: economy <new-report.json> [config.json]".into());
    }
    let config: Config = if let Some(path) = args.get(1) {
        serde_json::from_slice(&std::fs::read(path)?)?
    } else {
        Config::default()
    };
    let result = economy::report(101, config)?;
    let file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&args[0])?;
    serde_json::to_writer_pretty(file, &result)?;
    println!(
        "{}: analytical resource budget; zero ticks advanced",
        args[0]
    );
    Ok(())
}
