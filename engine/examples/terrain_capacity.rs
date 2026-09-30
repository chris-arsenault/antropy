//! Bounded terrain engineering workload, registered in TERRAIN-AND-SEASONS-PLAN.md.
use antropy_engine::{config::Config, world::World};
use serde_json::json;
use std::time::Instant;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<_> = std::env::args().collect();
    let integrated = args.get(1).is_some_and(|s| s == "integrated");
    let populated = args.get(2).is_some_and(|s| s == "populated");
    let retain_sources = args.get(3).is_some_and(|s| s == "sources");
    let mut c = if integrated {
        Config::ecology()
    } else {
        Config::default()
    };
    c.founders = 0;
    let pool = rayon::ThreadPoolBuilder::new().num_threads(4).build()?;
    let report=pool.install(|| -> Result<_,String> {
        let boot=Instant::now();
        let mut w=World::new(27,c)?;
        let boot_ms=boot.elapsed().as_secs_f64()*1000.;
        let initial_sources:Vec<_>=w.sources.iter().map(|s|s.habitat.clone()).collect();
        if populated {
            let sources = std::mem::take(&mut w.sources);
            antropy_engine::commands::load_fixture(&mut w,2000)?;
            if retain_sources {
                w.sources = sources;
                antropy_engine::source_medium::project(&mut w);
                antropy_engine::diagnostics::initialize(&mut w);
            }
        }
        for _ in 0..8 {w.step();}
        let at=Instant::now();
        let mut phases=[0.;9];
        let mut ticks=0;
        while ticks<40 && at.elapsed().as_secs_f64()<120. {
            for (sum,value) in phases.iter_mut().zip(w.step_measured(||at.elapsed().as_secs_f64()*1000.)) {*sum+=value;}
            ticks+=1;
        }
        let seconds=at.elapsed().as_secs_f64();
        let mut render=antropy_engine::render::Buffers::default();
        let draw=Instant::now();
        render.prepare(&w,13,0,3,true,0)?;
        let render_ms=draw.elapsed().as_secs_f64()*1000.;
        let save=Instant::now();
        let checkpoint=w.snapshot()?;
        let save_ms=save.elapsed().as_secs_f64()*1000.;
        let restore=Instant::now();
        World::restore(&checkpoint)?;
        let restore_ms=restore.elapsed().as_secs_f64()*1000.;
        let rss=std::fs::read_to_string("/proc/self/status").unwrap_or_default().lines()
            .find(|s|s.starts_with("VmHWM:")).unwrap_or("").to_owned();
        Ok(json!({"integrated":integrated,"populated":populated,"retainSources":retain_sources,
            "sourceCount":w.sources.len(),"workers":4,"population":w.cells.len(),
            "ticks":ticks,"ticksPerSecond":ticks as f64/seconds,"phasesMs":phases.map(|v|v/ticks as f64),
            "bootMs":boot_ms,"renderMs":render_ms,"checkpointBytes":checkpoint.len(),"saveMs":save_ms,
            "restoreMs":restore_ms,"peakRss":rss,"config":w.config,
            "initialSources":initial_sources,"finalSources":w.sources.iter().map(|s| &s.habitat).collect::<Vec<_>>(),
            "sourceDistance":w.ledger.source_distance,"sourceReleased":w.ledger.source_released,
            "supplied":w.ledger.supplied,"suppliedEnergy":w.ledger.supplied_energy}))
    })?;
    println!("{}", report);
    Ok(())
}
