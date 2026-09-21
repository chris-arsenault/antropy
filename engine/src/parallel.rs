//! Fork/join execution. Every call joins before the owner may publish or serialize state.
use rayon::prelude::*;

pub fn enabled(work: usize, minimum: usize) -> bool {
    if cfg!(all(target_arch = "wasm32", not(feature = "threads"))) {
        return false;
    }
    work >= minimum && rayon::current_num_threads() > 1
}

pub fn for_each<T: Send>(
    values: &mut [T],
    minimum: usize,
    f: impl Fn(usize, &mut T) + Sync + Send,
) {
    if enabled(values.len(), minimum) {
        values
            .par_iter_mut()
            .enumerate()
            .for_each(|(i, value)| f(i, value));
    } else {
        values
            .iter_mut()
            .enumerate()
            .for_each(|(i, value)| f(i, value));
    }
}
