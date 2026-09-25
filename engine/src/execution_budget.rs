//! Zero-tick feasibility screen. Rates describe this snapshot, not future error bounds.
use crate::{controller, interfaces::Graph, world::World};
#[path = "execution_budget_cells.rs"]
mod cells;
use cells::{chemical_rate, motion_rate, neural_rate, physiology_rates, transport_rates};
use serde_json::{Value, json};

const EPSILONS: [f64; 3] = [0.05, 0.1, 0.25];
const BINS: [f64; 8] = [0.05, 0.2, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6];

struct Sample {
    rate: f64,
    cost: f64,
    cap: f64,
}
impl Sample {
    fn new(rate: f64, cost: f64) -> Self {
        Self {
            rate,
            cost,
            cap: f64::INFINITY,
        }
    }
}

fn histogram(samples: &[Sample], interval: f64) -> Value {
    let cost: f64 = samples.iter().map(|s| s.cost).sum();
    let candidates: Vec<_> = EPSILONS
        .into_iter()
        .map(|epsilon| {
            let mut bins = [0.; 9];
            let (mut raw, mut optimistic, mut shorter, mut quiet) = (0., 0., 0., 0);
            for s in samples {
                let h = if s.rate > 0. {
                    epsilon / s.rate
                } else {
                    f64::INFINITY
                }
                .min(s.cap);
                let ratio = interval / h;
                bins[BINS.iter().position(|b| h <= *b).unwrap_or(BINS.len())] += s.cost;
                raw += s.cost * ratio;
                optimistic += s.cost * ratio.min(1.);
                shorter += if h < interval { s.cost } else { 0. };
                quiet += usize::from(h.is_infinite());
            }
            json!({"epsilon":epsilon,"weightedBins":bins,
            "requiredEvaluationRatio":raw/cost.max(1.),
            "savingsOnlyEvaluationRatio":optimistic/cost.max(1.),
            "weightRequiringShorterInterval":shorter,"unboundedAtSnapshot":quiet})
        })
        .collect();
    json!({"owners":samples.len(),"workWeight":cost,"currentIntervalSeconds":interval,
        "intervalUpperBoundsSeconds":BINS,"candidates":candidates})
}

fn field_rates(w: &World) -> (Vec<Sample>, Vec<f64>) {
    let f = &w.field;
    let max_impedance = w
        .chemistry
        .properties
        .iter()
        .map(|p| p.impedance)
        .fold(0., f64::max);
    let max_diffusion = w
        .chemistry
        .properties
        .iter()
        .map(|p| p.diffusion)
        .fold(0., f64::max);
    let floor = crate::field_activity::CONCENTRATION_FLOOR as f64 * f.spacing.powi(2);
    let mut samples = Vec::new();
    let mut rates = vec![0_f64; f.nx * f.ny];
    for (n, rate) in rates.iter_mut().enumerate() {
        let mut mask = f.active_groups(n);
        for &other in &f.neighbors[n] {
            mask |= f.active_groups(other);
        }
        if mask == 0 {
            continue;
        }
        let coefficients = f.coefficients(n, 1., w.config.diffusion_impedance, max_impedance);
        let mut outgoing = 0_f64;
        for s in crate::contact_exchange::species(mask) {
            let p = &w.chemistry.properties[s];
            let amount = f.amounts()[n * 256 + s] as f64;
            let (mut loss, mut incoming) = (0., 0.);
            for (face, c) in coefficients.iter().enumerate() {
                let diffusion = p.diffusion * c[0] as f64;
                let drift = p.interaction[0] * c[1] as f64
                    + p.interaction[1] * c[2] as f64
                    + p.impedance * c[3] as f64;
                loss += diffusion + drift.max(0.);
                incoming += f.amounts()[f.neighbors[n][face] * 256 + s] as f64
                    * (diffusion + (-drift).max(0.));
            }
            outgoing = outgoing.max(loss);
            *rate = (*rate).max((incoming - amount * loss).abs() / (amount + floor).max(1e-30));
        }
        // Conservative positivity bound for frozen faces, including currently absent chemicals.
        let envelope: f64 = coefficients
            .iter()
            .map(|c| {
                max_diffusion * c[0] as f64
                    + c[1].abs() as f64
                    + c[2].abs() as f64
                    + max_impedance * c[3].abs() as f64
            })
            .sum();
        samples.push(Sample {
            rate: *rate,
            cost: mask.count_ones() as f64,
            cap: 0.9 / envelope.max(outgoing).max(1e-30),
        });
    }
    (samples, rates)
}

pub fn report(w: &World) -> Value {
    let c = &w.config;
    let graph = Graph::new(&w.cells, c);
    let geometry = crate::movement::geometry::Contacts::new(&w.cells, c);
    let mut pressure = crate::movement::geometry::prepared::pressure::Pressure::default();
    pressure.prepare(&geometry, c.dt);
    let contact: Vec<_> = pressure.rows.iter().map(|row| row.shift).collect();
    let mut geometric_neighbors = vec![0; w.cells.len()];
    for edge in &geometry.edges {
        geometric_neighbors[edge.i] += 1;
        geometric_neighbors[edge.j] += 1;
    }
    let (field, local_field) = field_rates(w);
    let mut stages: [Vec<Sample>; 10] = std::array::from_fn(|_| Vec::new());
    let mut executor = crate::metabolism::Executor::default();
    let footprints: Vec<_> = w
        .cells
        .iter()
        .map(|cell| crate::footprint::sites(cell, c, &w.field))
        .collect();
    let exposures = crate::optics::observed_cell_exposures(w, &footprints);
    for (i, cell) in w.cells.iter().enumerate() {
        let row = crate::footprint::sites(cell, c, &w.field);
        let movement = motion_rate(cell, c, &w.field, &row, contact[i]);
        let neural = neural_rate(cell, w);
        let mixture = crate::numeric::mixture_masked(&w.field, &row, u64::MAX);
        let local = graph.local(i, &w.cells, c, &mixture);
        let (mut gross, mut net, support) = transport_rates(cell, c, &local, graph.field[i]);
        let (reaction, reaction_net, stock, spending, reaction_edges) =
            physiology_rates(cell, w, exposures[i], &mut executor);
        for s in 0..256 {
            gross[s] += reaction[s];
            net[s] += reaction_net[s];
        }
        let (chemical, bulk) = chemical_rate(cell, c, &net);
        let (gross_chemical, gross_bulk) = chemical_rate(cell, c, &gross);
        let neighbors = graph.neighbors(i).len();
        let external = row.iter().map(|&(n, _)| local_field[n]).fold(0., f64::max);
        let coupled = movement
            .max(neural)
            .max(chemical)
            .max(stock)
            .max(spending)
            .max(external);
        let exchange_work = (1 + support * (row.len() + neighbors + 1)) as f64;
        let reaction_work = (1 + reaction_edges * 3 + crate::organism::STOCKS) as f64;
        stages[0].push(Sample::new(
            movement.max(stock).max(neural).max(external),
            (row.len() * 8 + geometric_neighbors[i] + 1) as f64,
        ));
        stages[1].push(Sample::new(
            coupled,
            (controller::PARAMETERS + neighbors * support) as f64,
        ));
        stages[2].push(Sample::new(coupled, exchange_work));
        stages[3].push(Sample::new(coupled, reaction_work));
        stages[4].push(Sample::new(neural, 1.));
        stages[5].push(Sample::new(chemical, 1.));
        stages[6].push(Sample::new(bulk, 1.));
        stages[7].push(Sample::new(stock.max(spending), 1.));
        stages[8].push(Sample::new(gross_chemical, 1.));
        stages[9].push(Sample::new(gross_bulk, 1.));
    }
    let names = [
        "movement",
        "control",
        "exchange",
        "physiology",
        "intrinsicNeural",
        "netChemicalComponents",
        "netBulkMaterial",
        "stockAndWork",
        "grossChemicalThroughput",
        "grossBulkThroughput",
    ];
    let stages: serde_json::Map<String, Value> = names
        .into_iter()
        .zip(&stages)
        .enumerate()
        .map(|(i, (name, rows))| {
            (
                name.into(),
                histogram(rows, if i == 0 { c.dt } else { c.physiology_interval }),
            )
        })
        .collect();
    json!({"tick":w.tick,"physicalTicksAdvanced":0,"population":w.cells.len(),
        "fieldElapsedSeconds":w.field_elapsed,"field":histogram(&field,c.physiology_interval),"stages":stages,
        "method":"H=epsilon/normalizedRate, subject to frozen field positivity cap; work weights count local arithmetic support, not milliseconds",
        "limits":["Stored derived medium, interface and sensor inputs at this World tick; call after ordinary warmup",
            "Four ordinary fixed-input neural evaluations on cloned private state; not a future bound or equilibrium proof",
            "Ordinary funded reaction/repair/refit/growth probe on one cloned cell for config.dt; no live mutation",
            "Transport proposals include current geometry and work funding but omit donor contention and storage clipping",
            "Net chemical change combines signed transport proposals with cloned-probe inventory change; gross reaction plus transport throughput is reported separately and does not set coupled rates",
            "Chemical normalization is q+concentrationFloor*volume; bulk normalization is material+receptorK*volume",
            "Motion combines signed current-geometry contact shifts with swimming and passive drift; ordinary contact normalization affects sensor readings only",
            "Cell stage coupling is a heuristic maximum; coordinate refit speeds, future arrivals and new neighbors are not certified",
            "Field rates include current diffusion and drift only; source, weathering, washout and boundary-synchronization work remain unmodeled",
            "Savings-only ratio clips required increases to one: optimistic work estimate, not achievable throughput"]})
}
