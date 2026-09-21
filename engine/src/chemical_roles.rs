//! Read-only chemical role reductions. Installed capability is not measured reaction flux.
use crate::{chemical_operators::Conversions, organism::Cell, world::World};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

pub const PAGE_SIZE: usize = 64;
#[derive(Clone, Copy, Debug)]
pub struct Route {
    pub input: usize,
    pub output: usize,
    pub strength: f64,
}

fn stronger(candidate: Route, current: Option<Route>) -> bool {
    current.is_none_or(|old| {
        candidate.strength > old.strength
            || (candidate.strength == old.strength
                && (candidate.input, candidate.output) < (old.input, old.output))
    })
}

pub fn strongest(conversions: &Conversions) -> Option<Route> {
    let mut best = None;
    for edge in conversions {
        for product in &edge.products {
            let strength = edge.catalytic * product.weight;
            if product.species != edge.substrate && strength > 0. {
                let next = Route {
                    input: edge.substrate,
                    output: product.species,
                    strength,
                };
                if stronger(next, best) {
                    best = Some(next);
                }
            }
        }
    }
    best
}

pub fn primary(cell: &Cell) -> Option<Route> {
    let mut best = None;
    for (slot, enzyme) in cell.operators.as_ref()?.enzymes.iter().enumerate() {
        if !cell.installed.programs[slot] {
            continue;
        }
        if let Some(mut route) = enzyme.primary {
            route.strength *= cell.body[crate::organism::enzyme_stock(slot)];
            if route.strength > 0. && stronger(route, best) {
                best = Some(route);
            }
        }
    }
    best
}

pub fn color(cell: &Cell, output: bool) -> [f32; 3] {
    primary(cell).map_or([0.3, 0.35, 0.4], |route| {
        let id = if output { route.output } else { route.input };
        crate::presentation::hue_rgb((id as f64 * 0.618033988749895).fract())
    })
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Mode {
    Measured,
    Primary,
    Supported,
    Environment,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Query {
    pub mode: Mode,
    pub focus: Option<usize>,
    pub offset: usize,
}
impl Query {
    pub fn parse(value: &Value) -> Result<Self, String> {
        let query: Self = serde_json::from_value(value.clone()).map_err(|e| e.to_string())?;
        if query.focus.is_some_and(|s| s >= 256) || query.offset > 65536 {
            return Err("Chemical web query is outside its bounds".into());
        }
        Ok(query)
    }
}
#[derive(Clone, Default)]
struct Count {
    cells: usize,
    primary: usize,
    capacity: f64,
    seen: usize,
}
#[derive(Serialize)]
struct Row {
    input: usize,
    output: usize,
    cells: usize,
    primary: usize,
    capacity: f64,
}

fn cell_routes(w: &World) -> (Vec<Row>, usize) {
    let mut counts = vec![Count::default(); 256 * 256];
    let mut keys = Vec::new();
    let mut assigned = 0;
    for (index, cell) in w.cells.iter().enumerate() {
        let Some(operators) = &cell.operators else {
            continue;
        };
        for (slot, enzyme) in operators.enzymes.iter().enumerate() {
            let stock = cell.body[crate::organism::enzyme_stock(slot)];
            if !cell.installed.programs[slot] {
                continue;
            }
            if stock <= 0. {
                continue;
            }
            for edge in &enzyme.conversions {
                for p in &edge.products {
                    let capacity = stock * edge.catalytic * p.weight;
                    if p.species == edge.substrate || capacity <= 0. {
                        continue;
                    }
                    let key = edge.substrate * 256 + p.species;
                    let count = &mut counts[key];
                    if count.cells == 0 {
                        keys.push(key);
                    }
                    if count.seen != index + 1 {
                        count.cells += 1;
                        count.seen = index + 1;
                    }
                    count.capacity += capacity;
                }
            }
        }
        if let Some(route) = primary(cell) {
            counts[route.input * 256 + route.output].primary += 1;
            assigned += 1;
        }
    }
    let rows = keys
        .into_iter()
        .map(|key| {
            let c = &counts[key];
            Row {
                input: key / 256,
                output: key % 256,
                cells: c.cells,
                primary: c.primary,
                capacity: c.capacity,
            }
        })
        .collect();
    (rows, assigned)
}

fn environmental_routes(w: &World) -> Vec<Row> {
    if w.config.weathering_rate == 0. {
        return vec![];
    }
    let Some(operators) = &w.climate.operators else {
        return vec![];
    };
    let mut rows = Vec::new();
    for input in 0..256 {
        for j in 0..crate::weathering::BRANCHES {
            if !operators.possible(input, j, 1. + w.config.illumination_contrast) {
                continue;
            }
            rows.push(Row {
                input,
                output: operators.destination[input][j],
                cells: 0,
                primary: 0,
                capacity: 0.,
            });
        }
    }
    rows
}

pub fn overview(w: &World, query: &Query) -> Value {
    if query.mode == Mode::Measured {
        return crate::phenotype_report::web(w, query);
    }
    let (mut rows, assigned) = if query.mode == Mode::Environment {
        (
            environmental_routes(w),
            w.cells.iter().filter(|c| primary(c).is_some()).count(),
        )
    } else {
        cell_routes(w)
    };
    if query.mode == Mode::Primary {
        rows.retain(|row| row.primary > 0);
    }
    rows.retain(|row| {
        query
            .focus
            .is_none_or(|s| row.input == s || row.output == s)
    });
    rows.sort_by(|a, b| {
        let rank = |r: &Row| {
            if query.mode == Mode::Primary {
                r.primary
            } else {
                r.cells
            }
        };
        rank(b)
            .cmp(&rank(a))
            .then(b.capacity.total_cmp(&a.capacity))
            .then(a.input.cmp(&b.input))
            .then(a.output.cmp(&b.output))
    });
    let pairs = rows.len();
    let offset = query
        .offset
        .min(pairs.saturating_sub(1) / PAGE_SIZE * PAGE_SIZE);
    let page: Vec<_> = rows.into_iter().skip(offset).take(PAGE_SIZE).collect();
    json!({"tick":w.tick, "population":w.cells.len(), "assigned":assigned,
        "unassigned":w.cells.len()-assigned, "mode":query.mode, "focus":query.focus,
        "offset":offset, "pairs":pairs, "rows":page, "sources":source_species(w)})
}

pub fn source_species(w: &World) -> Vec<usize> {
    let mut sources = [false; 256];
    for source in &w.sources {
        if source.remaining > 0. {
            for (s, q) in source.inventory.iter().enumerate() {
                sources[s] |= *q > 0.;
            }
        }
    }
    (0..256).filter(|s| sources[*s]).collect()
}
