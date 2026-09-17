//! Conditional zero-tick payback, deliberately separate from controller expression.
use crate::{chemistry, config::Config, weathering};
use serde_json::{Value, json};

pub fn report(c: &Config, chemicals: &chemistry::Chemistry) -> Value {
    let operators = weathering::Operators::new(chemicals);
    let source = chemicals.source_species()[0];
    let deposit = chemicals
        .properties
        .iter()
        .enumerate()
        .max_by(|(_, a), (_, b)| {
            (a.impedance / a.diffusion).total_cmp(&(b.impedance / b.diffusion))
        })
        .unwrap()
        .0;
    let food = &chemicals.properties[source];
    let shelter = &chemicals.properties[deposit];
    let body = chemicals.properties[chemicals.decomposition].potential;
    let yield_per_food =
        chemistry::reaction_energy(food.potential, body, c.conversion_efficiency).0;
    let (production_work, _) =
        chemistry::reaction_energy(food.potential, shelter.potential, c.conversion_efficiency);
    let mut rows = vec![];
    for density in [0.25, 1.] {
        for amount in [0., 0.1, 0.4] {
            let area = 16. / density;
            let food_amount = 4.;
            let remaining_food = food_amount - amount;
            let impedance = (remaining_food * food.impedance + amount * shelter.impedance) / area;
            let exposure = weathering::exposure(1., impedance, true, c.diffusion_impedance);
            let signal = weathering::signal(std::array::from_fn(|k| {
                (remaining_food * food.interaction[k] + amount * shelter.interaction[k]) / area
            }));
            let loss = operators
                .fractions(
                    source,
                    signal,
                    c.weathering_rate * c.physiology_interval * exposure,
                )
                .iter()
                .sum::<f64>();
            let retained = remaining_food * (1. - loss).powf(60. / c.physiology_interval);
            // Import and export each cost ordinary transport work. The deposited feedstock
            // also forfeits the same terminal processing opportunity as retained food.
            let production_cost = amount * (-production_work + 2. * c.transport_energy);
            rows.push(json!({"density":density,"deposit":amount,"effectiveExposure":exposure,
                "remainingSource":retained,"conditionalWork":retained*yield_per_food-production_cost,
                "productionCost":production_cost,"foregoneFeedstockWork":amount*yield_per_food}));
        }
    }
    json!({"ticksAdvanced":0,"source":source,"deposit":deposit,
        "sourceProperties":food,"depositProperties":shelter,
        "sourceWeatheringProduct":operators.destination[source],
        "rate":c.weathering_rate,
        "protection":c.diffusion_impedance,"rows":rows,
        "assumptions":["Four material units over sixteen or sixty-four square units for sixty model seconds",
        "Deposit synthesized from the same finite feedstock; ordinary import/export work counted",
        "Frozen initial medium and impedance; no geographic escape, product feedback or deposit aging",
        "Source specialist cannot process the weathering product; terminal processing yield is a bound",
        "Existing funded machinery; new stock, upkeep, injury and neighbor capture lower the return",
        "Conditional opportunity only; production World must establish actual net return"]})
}
