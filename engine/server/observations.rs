use antropy_engine::{commands, world::World};
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Default)]
pub struct Observations {
    origins: Value,
    regions: Vec<Value>,
    members: BTreeMap<u64, Value>,
    next_region: u64,
    history: Vec<Value>,
    recent: Vec<Value>,
    events: Vec<Value>,
    dropped: usize,
    tick: Option<u64>,
}
fn array(v: &Value) -> &[Value] {
    v.as_array().map_or(&[], Vec::as_slice)
}
fn integer(v: &Value) -> u64 {
    v.as_u64().unwrap_or(0)
}
impl Observations {
    pub fn members(&self, selection: &Value) -> Value {
        if selection["kind"] != "region" {
            return json!([]);
        }
        self.members
            .get(&integer(&selection["id"]))
            .cloned()
            .unwrap_or(json!([]))
    }
    fn census(&mut self, w: &mut World) -> Result<Value, String> {
        let c = commands::execute(
            w,
            &json!({"op":"census", "origins":if self.origins.is_null() { json!([]) } else { self.origins.clone() }}),
        )?;
        if self.tick == Some(w.tick) {
            return Ok(c["population"].clone());
        }
        let mut votes = Vec::new();
        for (i, g) in array(&c["regions"]).iter().enumerate() {
            for v in array(&g["votes"]) {
                votes.push((integer(&v[1]), integer(&v[0]), i));
            }
        }
        votes.sort_by(|a, b| b.0.cmp(&a.0).then(a.1.cmp(&b.1)).then(a.2.cmp(&b.2)));
        let old: BTreeMap<u64, Value> = self
            .regions
            .drain(..)
            .map(|r| (integer(&r["id"]), r))
            .collect();
        let mut used = BTreeSet::new();
        let mut matches = BTreeMap::new();
        for (_, id, i) in votes {
            if old.contains_key(&id) && !used.contains(&id) && !matches.contains_key(&i) {
                matches.insert(i, id);
                used.insert(id);
            }
        }
        let mut origins: BTreeMap<u64, u64> = array(&c["origins"])
            .iter()
            .map(|v| (integer(&v[0]), integer(&v[1])))
            .collect();
        self.members.clear();
        let mut represented = BTreeSet::new();
        for (i, g) in array(&c["regions"]).iter().enumerate() {
            let id = *matches.entry(i).or_insert_with(|| {
                self.next_region += 1;
                self.next_region
            });
            let previous = old.get(&id);
            let others: Vec<u64> = array(&g["votes"]).iter().map(|v| integer(&v[0])).collect();
            represented.extend(others.iter().copied());
            let born = previous.map_or(w.tick, |r| integer(&r["born"]));
            let established = previous.map_or(Value::Null, |r| r["established"].clone());
            let mut r = json!({"id":id,"x":g["x"],"y":g["y"],"membraneX":g["membraneX"],
                "born":born,"established":established,"count":array(&g["members"]).len(),
                "origins":previous.map_or(json!(others), |r| r["origins"].clone()),"lineages":g["lineages"]});
            if previous.is_none() {
                self.event(
                    w.tick,
                    &r,
                    if others.iter().any(|id| old.contains_key(id)) {
                        "split"
                    } else {
                        "appearance"
                    },
                    json!(others),
                );
            }
            if others.iter().filter(|id| old.contains_key(id)).count() > 1 {
                self.event(w.tick, &r, "merge", json!(others));
            }
            if r["established"].is_null()
                && g["youngestDescendant"].as_u64().is_some_and(|t| t >= born)
            {
                r["established"] = json!(w.tick);
                self.event(w.tick, &r, "founding", r["origins"].clone());
            }
            for member in array(&g["members"]) {
                origins.insert(integer(member), id);
            }
            if previous.is_some() {
                for vote in array(&g["votes"]).iter().filter(|v| integer(&v[0]) != id) {
                    let mut migrant = r.clone();
                    migrant["count"] = vote[1].clone();
                    self.event(w.tick, &migrant, "migration", json!([vote[0]]));
                }
            }
            self.members.insert(id, g["members"].clone());
            self.regions.push(r);
        }
        for (id, r) in old {
            if !represented.contains(&id) {
                self.event(w.tick, &r, "dissolved", json!([]));
            }
        }
        self.origins = json!(origins.into_iter().collect::<Vec<_>>());
        if let Some(o) = &mut w.observer
            && let antropy_engine::phenotype::Selection::Region { id } = o.selection
        {
            o.region = array(&self.members.get(&id).cloned().unwrap_or(json!([])))
                .iter()
                .map(integer)
                .collect();
        }
        self.tick = Some(w.tick);
        Ok(c["population"].clone())
    }
    fn event(&mut self, tick: u64, r: &Value, kind: &str, others: Value) {
        self.events.push(json!({"tick":tick,"population":r["id"],"kind":kind,"x":r["x"],"y":r["y"],"cells":r["count"],"others":others}));
        if self.events.len() > 64 {
            self.events.remove(0);
            self.dropped += 1;
        }
    }
    pub fn status(
        &mut self,
        w: &mut World,
        running: bool,
        speed: Option<f64>,
        throughput: f64,
        threads: usize,
    ) -> Result<Value, String> {
        let population = self.census(w)?;
        let summary = commands::execute(w, &json!({"op":"summary"}))?;
        let chemicals = commands::execute(w, &json!({"op":"chemicalOverview"}))?;
        let phenotype = commands::execute(w, &json!({"op":"phenotype","action":"report"}))?;
        let traits: Vec<_> = array(&population["traits"])
            .iter()
            .map(|v| v["median"].clone())
            .collect();
        let membrane: Vec<f64> = array(&population["membrane"])
            .chunks(16)
            .map(|c| c.iter().filter_map(Value::as_f64).sum())
            .collect();
        if self.history.last().is_none_or(|p| p["tick"] != w.tick) {
            self.history.push(json!({"tick":w.tick,"population":summary["population"],"biomass":summary["biomass"],
                "divisions":summary["ledger"]["divisions"],"deaths":summary["ledger"]["deaths"],"traits":traits,"membrane":membrane,
                "families":population["families"]["rows"],"lineages":population["lineages"]["rows"],
                "regions":self.regions.iter().take(64).collect::<Vec<_>>(),"regionCount":self.regions.len()}));
            if !phenotype["pin"].is_null() {
                self.history.last_mut().unwrap()["phenotype"] = json!({"id":phenotype["pin"]["id"],
                    "count":phenotype["groups"][2]["count"],"actual":phenotype["groups"][2]["actual"],"target":phenotype["groups"][2]["target"]});
            }
            if self.history.len() > 240 {
                self.history = self
                    .history
                    .drain(..)
                    .enumerate()
                    .filter(|(i, _)| i % 2 == 0)
                    .map(|(_, v)| v)
                    .collect();
            }
            self.recent
                .retain(|p| integer(&p["tick"]) >= w.tick.saturating_sub(2000));
            self.recent.push(json!({"tick":w.tick,"population":summary["population"],"bins":array(&population["efforts"]).iter().map(|v| &v["bins"]).collect::<Vec<_>>()}));
            if self.recent.len() > 80 {
                self.recent.remove(0);
            }
        }
        Ok(
            json!({"summary":summary,"population":population,"chemicals":chemicals,"phenotype":phenotype,"chemicalWeb":null,
            "kernelDigest":option_env!("GITHUB_SHA").unwrap_or("native-development"),
            "running":running,"speed":speed.map_or(json!("max"), |v| json!(v)),"throughput":throughput,"recovery":"Server world; browser saves unavailable",
            "error":null,"history":self.history,"recent":self.recent,"regions":self.regions.iter().take(64).collect::<Vec<_>>(),
            "spatialEvents":self.events,"eventsDropped":self.dropped,"workerWork":null,"memoryBytes":resident_bytes(),
            "execution":{"location":"server","threads":threads,"connected":true,"operator":false}}),
        )
    }
}
fn resident_bytes() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("VmRSS:"))
                .and_then(|l| l.split_whitespace().nth(1))
                .and_then(|v| v.parse::<u64>().ok())
        })
        .unwrap_or(0)
        * 1024
}
