//! Neural ports move with enzyme programs; physiology never inspects weights.
use super::*;

pub const fn stock_input(slot: usize) -> usize {
    if slot < 4 { 24 + slot } else { 48 + slot }
}
pub(super) fn seed_requests(weights: &mut [f32]) {
    weights[OUTPUT_BIAS + ACTIVITY..OUTPUT_BIAS + RETIREMENT].fill(3.);
    weights[OUTPUT_BIAS + RETIREMENT] = 0.;
}
pub fn duplicate(g: &mut Genome, source: usize, destination: usize) {
    let (from, to) = (stock_input(source), stock_input(destination));
    for h in 0..HIDDEN {
        let value = g.weights[h * INPUTS + from] * 0.5;
        g.weights[h * INPUTS + from] = value;
        g.weights[h * INPUTS + to] = value;
    }
    for (from, to) in [
        (ACTIVITY + source, ACTIVITY + destination),
        (
            ALLOCATION + crate::organism::enzyme_stock(source),
            ALLOCATION + crate::organism::enzyme_stock(destination),
        ),
    ] {
        for h in 0..HIDDEN {
            g.weights[OUTPUT + to * HIDDEN + h] = g.weights[OUTPUT + from * HIDDEN + h];
        }
        g.weights[OUTPUT_BIAS + to] = g.weights[OUTPUT_BIAS + from];
    }
}
pub fn remove(g: &mut Genome, slot: usize) {
    for h in 0..HIDDEN {
        g.weights[h * INPUTS + stock_input(slot)] = 0.;
    }
    for output in [
        ACTIVITY + slot,
        ALLOCATION + crate::organism::enzyme_stock(slot),
    ] {
        g.weights[OUTPUT + output * HIDDEN..OUTPUT + (output + 1) * HIDDEN].fill(0.);
        g.weights[OUTPUT_BIAS + output] = 0.;
    }
}
pub fn copy_from(recipient: &mut Genome, donor: &Genome, slot: usize) {
    for h in 0..HIDDEN {
        recipient.weights[h * INPUTS + stock_input(slot)] =
            donor.weights[h * INPUTS + stock_input(slot)];
    }
    for output in [
        ACTIVITY + slot,
        ALLOCATION + crate::organism::enzyme_stock(slot),
    ] {
        recipient.weights[OUTPUT + output * HIDDEN..OUTPUT + (output + 1) * HIDDEN]
            .copy_from_slice(
                &donor.weights[OUTPUT + output * HIDDEN..OUTPUT + (output + 1) * HIDDEN],
            );
        recipient.weights[OUTPUT_BIAS + output] = donor.weights[OUTPUT_BIAS + output];
    }
}

#[cfg(test)]
pub(crate) fn permute(g: &Genome, order: [usize; crate::organism::MAX_ENZYMES]) -> Genome {
    let mut result = g.clone();
    for (to, from) in order.into_iter().enumerate() {
        for h in 0..HIDDEN {
            result.weights[h * INPUTS + stock_input(to)] =
                g.weights[h * INPUTS + stock_input(from)];
        }
        for (from, to) in [
            (ACTIVITY + from, ACTIVITY + to),
            (
                ALLOCATION + crate::organism::enzyme_stock(from),
                ALLOCATION + crate::organism::enzyme_stock(to),
            ),
        ] {
            for h in 0..HIDDEN {
                result.weights[OUTPUT + to * HIDDEN + h] = g.weights[OUTPUT + from * HIDDEN + h];
            }
            result.weights[OUTPUT_BIAS + to] = g.weights[OUTPUT_BIAS + from];
        }
    }
    result
}
