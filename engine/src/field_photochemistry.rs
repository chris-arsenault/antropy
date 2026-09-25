//! Conversion follows geographic transport so optical reservations use the actual donors.
use super::*;
use rayon::prelude::*;
use std::collections::BTreeMap;

impl Field {
    pub fn photochemistry(
        &mut self,
        chemistry: &Chemistry,
        climate: &crate::climate::Climate,
        dt: f64,
        budget: &BTreeMap<usize, crate::optics::Exposure>,
    ) -> (FieldBalance, f64) {
        let rows = self.projection_rows(chemistry);
        let geometry = self.amounts.geometry();
        let area = self.area();
        let carriers = &self.carriers;
        let process =
            |entry: &mut crate::spatial_regions::Entry<crate::spatial_material::Region>| {
                let region = &mut entry.value;
                let mut weather = climate.clone();
                let mut difference = [0.; 2];
                let mut paid = 0.;
                let mut changed = false;
                for (site, n) in geometry.sites(entry.id) {
                    let mask = region.masks[site];
                    if mask == 0 {
                        continue;
                    }
                    let p = region.projection[site];
                    let carried = carriers.site(n);
                    let signal = std::array::from_fn(|k| {
                        p[4 + k] / area + carried.signal[0][k] + carried.signal[1][k]
                    });
                    let load = p[2] / area + carried.load[1];
                    let exposure = budget[&n];
                    let before = weather.work;
                    let next = weather.convert_funded(
                        region.row_mut(site),
                        mask,
                        (signal, load),
                        dt,
                        exposure,
                    );
                    paid += (weather.work - before) * exposure.paid_fraction();
                    region.masks[site] = next;
                    let after =
                        crate::chemical_projection::project_active(region.row(site), &rows, next);
                    region.projection[site] = after;
                    for k in 0..2 {
                        difference[k] += after[k] - p[k];
                    }
                    changed |= p[4..] != after[4..];
                }
                (entry.id, difference, weather, paid, changed)
            };
        let entries = &mut self.amounts.regions.entries;
        let results: Vec<_> = if let Some(grain) =
            crate::parallel::grain(entries.len(), crate::parallel::cost::FIELD_REGION)
        {
            entries
                .par_iter_mut()
                .with_min_len(grain)
                .map(process)
                .collect()
        } else {
            entries.iter_mut().map(process).collect()
        };
        let mut balance = FieldBalance::default();
        let mut paid = 0.;
        for (id, difference, weather, used, changed) in results {
            for (total, delta) in self.totals.iter_mut().zip(difference) {
                *total += delta;
            }
            balance.roundoff_matter -= difference[0];
            balance.roundoff_energy += weather.work - weather.heat - difference[1];
            balance.weathering_work += weather.work - used;
            balance.weathering_heat += weather.heat;
            balance.weathered_material += weather.converted;
            balance.sheltered_conversion += weather.prevented;
            paid += used;
            if changed {
                self.signal_changes.insert(id);
            }
        }
        self.amounts.prune();
        (balance, paid)
    }
}
