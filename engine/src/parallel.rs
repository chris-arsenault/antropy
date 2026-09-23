//! Fork/join execution. Every call joins before the owner may publish or serialize state.
//! Sections are scheduled from estimated work: each stolen task carries at least
//! `TASK_NS` of it, and a section with less than two tasks stays on the calling thread.
use rayon::prelude::*;

/// Target estimated work per task. Forking, stealing and joining cost on the order of a
/// microsecond per participating thread, so a task should carry tens of microseconds.
pub const TASK_NS: usize = 20_000;

/// Estimated single-thread cost per item, measured on the populated tick-15000 checkpoint.
/// They set task granularity only; no simulation result depends on them.
pub mod cost {
    /// Controller evaluation and motion of one cell.
    pub const CELL_STEP: usize = 1_500;
    /// One cell's sensing, interface reading, exchange request or commit.
    pub const CELL_READ: usize = 400;
    /// One cell's interval chemistry.
    pub const CELL_PHYSIOLOGY: usize = 1_300;
    /// Marking one cell's footprint nodes.
    pub const CELL_MARK: usize = 80;
    /// One cell's coefficient preparation from shared dependencies.
    pub const CELL_PREPARE: usize = 500;
    /// One reservoir's response, conversion and motion.
    pub const RESERVOIR: usize = 8_000;
    /// One geographic donor node's allocation or projection.
    pub const EXCHANGE_NODE: usize = 150;
    /// One row commit into regional material.
    pub const COMMIT_ROW: usize = 300;
    /// Clearing one requested row.
    pub const ROW_CLEAR: usize = 50;
    /// One region of the medium transport pass.
    pub const FIELD_REGION: usize = 6_000;
    /// One region of one attraction axis pass or input check.
    pub const FILTER_REGION: usize = 1_500;
    /// One region of footprint dependency and gradient evaluation.
    pub const DEPENDENCY_REGION: usize = 3_000;
    /// Expanding one carrier owner's change into site deposits.
    pub const CARRIER_OWNER: usize = 300;
    /// Applying one carrier site deposit.
    pub const CARRIER_DEPOSIT: usize = 20;
    /// One occupied contact-search bin.
    pub const CONTACT_BIN: usize = 2_000;
}

pub fn enabled(work: usize, minimum: usize) -> bool {
    if cfg!(all(target_arch = "wasm32", not(feature = "threads"))) {
        return false;
    }
    work >= minimum && rayon::current_num_threads() > 1
}

/// Items per task for items of estimated cost `item_ns`, or `None` when the section holds
/// less than two tasks of work and should run on the calling thread.
pub fn grain(items: usize, item_ns: usize) -> Option<usize> {
    let item = item_ns.max(1);
    enabled(items.saturating_mul(item), 2 * TASK_NS).then(|| (TASK_NS / item).max(1))
}

pub fn for_each<T: Send>(
    values: &mut [T],
    item_ns: usize,
    f: impl Fn(usize, &mut T) + Sync + Send,
) {
    match grain(values.len(), item_ns) {
        Some(grain) => values
            .par_iter_mut()
            .enumerate()
            .with_min_len(grain)
            .for_each(|(i, value)| f(i, value)),
        None => values
            .iter_mut()
            .enumerate()
            .for_each(|(i, value)| f(i, value)),
    }
}
