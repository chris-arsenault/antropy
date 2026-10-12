//! Bounded operator history independent of spectators and empty environmental time.
use antropy_engine::{
    ecology_observation::{END_BYTES, END_COUNT, WINDOW},
    observation_records::Records,
    world::World,
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::{
    collections::VecDeque,
    time::{SystemTime, UNIX_EPOCH},
};

pub const MAX_BYTES: usize = 64 * 1024 * 1024;
pub const RUNS: usize = 3;
const RECENT: usize = 512;
const OVERVIEW: usize = 256;
const RECENT_BYTES: usize = 8 * 1024 * 1024;
const OVERVIEW_BYTES: usize = 4 * 1024 * 1024;

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Run {
    id: String,
    generation: u64,
    seed: u64,
    physical_version: u32,
    started_at: u64,
    started_tick: u64,
    last_tick: u64,
    config: Value,
    extinct_at: Option<u64>,
    points_seen: u64,
    overview_stride: u64,
    recent: Records,
    overview: Records,
    endings: Records,
    endings_seen: u64,
    endings_unsampled: u64,
    endings_dropped_before_collection: u64,
}
#[derive(Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct History {
    pub runs: VecDeque<Run>,
    pub revision: u64,
    pub runs_expired: u64,
    pub load_error: Option<String>,
}
impl History {
    pub fn begin(&mut self, w: &mut World, generation: u64) {
        let at = now_ms();
        self.runs.push_back(Run {
            id: format!("{at}-g{generation}-t{}", w.tick),
            generation,
            seed: w.seed,
            physical_version: w.version,
            started_at: at,
            started_tick: w.tick,
            last_tick: w.tick,
            config: json!(w.config),
            extinct_at: None,
            points_seen: 0,
            overview_stride: 1,
            recent: Records::new(RECENT, RECENT_BYTES),
            overview: Records::new(OVERVIEW, OVERVIEW_BYTES),
            endings: Records::new(END_COUNT, END_BYTES),
            endings_seen: 0,
            endings_unsampled: 0,
            endings_dropped_before_collection: 0,
        });
        while self.runs.len() > RUNS {
            self.runs.pop_front();
            self.runs_expired += 1;
        }
        self.observe(w, true);
    }
    pub fn observe(&mut self, w: &mut World, force: bool) {
        let Some(run) = self.runs.back_mut() else {
            return;
        };
        if let Some(observer) = &mut w.ecology {
            if run.endings_seen != observer.endings_seen {
                self.revision += 1;
            }
            for event in observer.endings.drain() {
                run.endings.push(event);
            }
            run.endings_seen = observer.endings_seen;
            run.endings_unsampled = observer.endings_unsampled;
            run.endings_dropped_before_collection = observer.endings.dropped;
        }
        let previous_population = run
            .recent
            .entries
            .back()
            .and_then(|p| p["global"]["population"].as_u64());
        let extinction = previous_population.is_some_and(|p| p > 0) && w.cells.is_empty();
        if previous_population == Some(0)
            || (!force && !extinction && w.tick.saturating_sub(run.last_tick) < WINDOW)
        {
            return;
        }
        if run.points_seen > 0 && run.last_tick == w.tick {
            return;
        }
        let point = super::ecology_sample::point(w);
        if extinction {
            run.extinct_at = Some(w.tick);
        }
        if run.points_seen.is_multiple_of(run.overview_stride) || extinction {
            while !run.overview.can_push(&point) && run.overview.entries.len() > 1 {
                run.overview.decimate();
                run.overview_stride = run.overview_stride.saturating_mul(2);
            }
            run.overview.push(point.clone());
        }
        run.recent.push(point);
        run.last_tick = w.tick;
        run.points_seen += 1;
        if let Some(observer) = &mut w.ecology {
            observer.local_endings.clear();
        }
        self.revision += 1;
    }
    pub fn rebound(&mut self) {
        while self.runs.len() > RUNS {
            self.runs.pop_front();
            self.runs_expired += 1;
        }
        for run in &mut self.runs {
            run.recent.rebound(RECENT, RECENT_BYTES);
            run.overview.rebound(OVERVIEW, OVERVIEW_BYTES);
            run.endings.rebound(END_COUNT, END_BYTES);
            run.overview_stride = run.overview_stride.max(1);
        }
    }
    pub fn report(&self, w: &World, generation: u64) -> Value {
        json!({"schema":1,"generation":generation,"current":super::ecology_sample::global(w),
            "history":self,"limits":{"runs":RUNS,"sampleTicks":WINDOW,"recentPoints":RECENT,
                "neighborhoodsPerPoint":super::ecology_sample::MAX_NEIGHBORHOODS,
                "overviewPoints":OVERVIEW,"recentBytesPerRun":RECENT_BYTES,
                "overviewBytesPerRun":OVERVIEW_BYTES,"endRecordsPerRun":END_COUNT,
                "endBytesPerRun":END_BYTES,"rawPersistenceBytes":MAX_BYTES},
            "coverage":{"endSampling":"First ending per250 ticks above64 observed cells; all endings at64 or fewer, subject to count/byte retention",
                "neighborhoods":"Nearest reservoir at observation time; resident paid windows can include activity elsewhere; above256 groups, a rotating bounded subset is shown with explicit omitted count",
                "chemistry":"Neighborhood mixtures show top eight shares; end records include full local and overlapping-source mixtures",
                "continuity":"Each startup or world replacement starts a new segment; earlier unobserved time is not reconstructed",
                "emptyTime":"Populated history and extinction point stop aging out when population reaches zero"}})
    }
}
