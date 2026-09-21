use super::*;
type RequestRow<'a> = (
    usize,
    (
        ((&'a mut [f64; 256], &'a mut [f64; 256]), &'a mut u64),
        &'a mut Vec<(usize, f64)>,
    ),
);

fn requests(
    cell: &Cell,
    c: &Config,
    local: &[f64; 256],
    imports: &mut [f64; 256],
    exports: &mut [f64; 256],
) -> u64 {
    if cell.damage == 1. || (cell.energy == 0. && c.transport_energy > 0.) {
        return 0;
    }
    let mut mask = 0;
    let volume = cell.volume(c).max(1e-30);
    for (slot, recognition) in cell
        .operators
        .as_ref()
        .unwrap()
        .transporters
        .iter()
        .enumerate()
    {
        let effort = 2. * cell.action.transport[slot] - 1.;
        let capacity = c.dt
            * c.transporter_turnover
            * cell.body[7 + slot]
            * (1. - cell.damage)
            * effort.abs()
            * if effort < 0. {
                cell.interface.field
            } else {
                1.
            };
        if capacity == 0. {
            continue;
        }
        let available = |s| {
            if effort >= 0. {
                local[s]
            } else {
                cell.inventory.value(s) / volume
            }
        };
        let occupied: f64 = recognition
            .iter()
            .map(|a| a.value * available(a.species))
            .sum();
        let gain = capacity / (c.receptor_k + occupied);
        let destination = if effort >= 0. {
            &mut *imports
        } else {
            &mut *exports
        };
        for a in recognition.iter() {
            let q = gain * a.value * available(a.species);
            if q > 0. {
                destination[a.species] += q;
                mask |= 1 << (a.species / 4);
            }
        }
    }
    let incoming: f64 = species(mask).map(|s| imports[s]).sum();
    let headroom = (cell.capacity(c) - cell.material()).max(0.);
    let room = if incoming > 0. {
        (headroom / incoming).min(1.)
    } else {
        1.
    };
    let mut requested = 0.;
    for s in species(mask) {
        imports[s] *= room;
        exports[s] = exports[s].min(cell.inventory.value(s));
        requested += imports[s] + exports[s];
    }
    let paid = if c.transport_energy * requested > 0. {
        (cell.energy / (c.transport_energy * requested)).min(1.)
    } else {
        1.
    };
    for s in species(mask) {
        imports[s] *= paid;
        exports[s] *= paid;
    }
    mask
}

impl Exchange {
    pub(super) fn prepare_requests(
        &mut self,
        cells: &[Cell],
        c: &Config,
        field: &Field,
        sites: &[crate::footprint::Row],
        graph: &crate::interfaces::Graph,
    ) {
        self.prepare_nodes(field.nx * field.ny, sites);
        for (i, &mask) in self.masks.iter().enumerate() {
            clear(&mut self.imports[i], mask);
            clear(&mut self.exports[i], mask);
        }
        self.imports.resize(cells.len(), [0.; 256]);
        self.exports.resize(cells.len(), [0.; 256]);
        self.masks.resize(cells.len(), 0);
        self.contact
            .begin(if graph.neighbors.iter().any(|row| !row.is_empty()) {
                cells.len()
            } else {
                0
            });
        self.contact_support.resize_with(cells.len(), Vec::new);
        let request = |(i, (((imports, exports), mask), support)): RequestRow<'_>| {
            let cell = &cells[i];
            support.clear();
            let active = import_support(cell, c);
            let field_local = crate::numeric::mixture_masked(field, &sites[i], active);
            let local = graph.local_masked(i, cells, c, &field_local, active);
            *mask = requests(cell, c, &local, imports, exports);
            if !graph.neighbors[i].is_empty() {
                for s in species(*mask) {
                    if imports[s] > 0. && local[s] > 0. {
                        support.push((s, imports[s] / local[s]));
                    }
                    imports[s] = if local[s] > 0. {
                        imports[s] / local[s] * graph.field[i] * field_local[s] as f64
                    } else {
                        0.
                    };
                }
            }
        };
        if crate::parallel::enabled(cells.len(), 128) {
            self.imports
                .par_iter_mut()
                .zip(self.exports.par_iter_mut())
                .zip(self.masks.par_iter_mut())
                .zip(self.contact_support.par_iter_mut())
                .enumerate()
                .for_each(request);
        } else {
            self.imports
                .iter_mut()
                .zip(self.exports.iter_mut())
                .zip(self.masks.iter_mut())
                .zip(self.contact_support.iter_mut())
                .enumerate()
                .for_each(request);
        }
        for (i, support) in self.contact_support.iter().enumerate() {
            self.contact.request_intensity(i, graph, support);
        }
        self.contact
            .allocate(cells, &mut self.exports, graph, &self.masks);
        self.project_requests(sites);
        self.preparations += cells.len() as u64;
    }
}
