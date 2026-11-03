//! One matched ordinary-start comparison through nominal renewal, not an ecology campaign.
use antropy_engine::{configuration, economy, observation, phenotype::Observer, world::World};
use serde_json::json;
use std::{fs, io::Write, path::Path, time::Instant};

pub fn run(config: &Path, root: &Path) -> super::Result<()> {
    fs::create_dir(root)?;
    let requested = configuration::text(&fs::read_to_string(config)?)?;
    let duration = 2. * (requested.source_lifetime + requested.source_gap);
    super::save(
        &root.join("registration.json"),
        &json!({
        "question":"Does the repair preserve ordinary founder establishment and funded replacement through source renewals with ordinary mutation and all features enabled?",
        "competingExplanations":["Normalization removes an access barrier without destabilizing the seeded economy","Altered recognition causes a startup or replenishment regression"],
        "seed":27,"config":requested,"modelSecondsPerArm":duration,"wallSecondsPerArm":240,
        "arms":["coupled","independent"],"prediction":"Both initially identical founder populations can pay and reproduce; no requirement that an evolved secondary economy arise in this bounded delivery check.",
        "decision":"Whether ordinary startup is suitable for delivery; extinction or failed replacement requires diagnosis, not another seed search.",
        "limits":"One matched-start comparison, not independent replicates or proof of indefinite survival/evolved waste use."}),
    )?;
    rayon::ThreadPoolBuilder::new().num_threads(4).build()?.install(|| {
        for independent in [false,true] {
            let arm=if independent {"independent"}else{"coupled"};
            let mut config=requested.clone(); config.binding_independent_strength=independent;
            let dir=root.join(arm); fs::create_dir(&dir).map_err(|e|e.to_string())?;
            super::save(&dir.join("budget.json"),&economy::report(27,config.clone())?).map_err(|e|e.to_string())?;
            let mut w=World::new(27,config)?;
            fs::write(dir.join("initial.bin"),w.snapshot()?).map_err(|e|e.to_string())?;
            let mut observer=Observer::new(0); observer.enabled=true; w.observer=Some(Box::new(observer));
            let mut samples=fs::OpenOptions::new().create_new(true).write(true).open(dir.join("samples.jsonl")).map_err(|e|e.to_string())?;
            let timer=Instant::now();
            while w.tick as f64*w.config.dt<duration && !w.cells.is_empty() && w.stop_reason.is_none() && timer.elapsed().as_secs_f64()<240. {
                w.step();
                if w.tick.is_multiple_of(250) {
                    let web=antropy_engine::commands::execute(&mut w,&json!({"op":"chemicalWeb","mode":"measured","focus":null,"offset":0}))?;
                    let inputs=&web["activity"];
                    writeln!(samples,"{}",json!({"summary":observation::summary(&w),"activity":inputs})).map_err(|e|e.to_string())?;
                }
                if w.tick.is_multiple_of(3000) { println!("{arm}: tick={} population={} divisions={} deaths={}",w.tick,w.cells.len(),w.ledger.divisions,w.ledger.deaths); }
            }
            let reason=if w.cells.is_empty(){"extinction"}else if w.stop_reason.is_some(){"execution failure"}else if w.tick as f64*w.config.dt>=duration{"horizon"}else{"wall cap"};
            w.validate()?;
            fs::write(dir.join("final.bin"),w.snapshot()?).map_err(|e|e.to_string())?;
            super::save(&dir.join("result.json"),&json!({"arm":arm,"reason":reason,"wallSeconds":timer.elapsed().as_secs_f64(),"summary":observation::summary(&w)})).map_err(|e|e.to_string())?;
            println!("{arm}: {reason} at {} ticks, {} cells",w.tick,w.cells.len());
            if w.stop_reason.is_some() {return Err("Ordinary comparison failed physical execution".to_string());}
        }
        Ok::<_,String>(())
    })?;
    Ok(())
}
