impl crate::field::Field {
    pub(crate) fn apply_carriers(&mut self, changes: &[crate::spatial_carriers::Change<'_>]) {
        self.carriers.apply(changes);
    }
    pub(crate) fn reset_carriers(&mut self, kind: u8) {
        self.carriers.reset(kind);
    }
    /// Replaces reservoir contributions by index; unchanged reservoirs deposit nothing.
    pub(crate) fn project_sources(&mut self, current: Vec<crate::spatial_carriers::Owned>) {
        let previous = std::mem::take(&mut self.carriers.sources);
        let empty = (Vec::new(), [0.; 3]);
        let changes: Vec<_> = (0..previous.len().max(current.len()))
            .filter_map(|i| {
                let old = previous.get(i).unwrap_or(&empty);
                let new = current.get(i).unwrap_or(&empty);
                (old != new).then_some(crate::spatial_carriers::Change {
                    kind: 1,
                    old: (&old.0, old.1),
                    new: (&new.0, new.1),
                })
            })
            .collect();
        self.carriers.apply(&changes);
        self.carriers.sources = current;
    }
}
