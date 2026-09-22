impl crate::field::Field {
    pub(crate) fn carrier(&mut self, kind: u8, id: u64, sites: &[(usize, f64)], profile: [f64; 3]) {
        let (signal, load) = if kind == 0 {
            (&mut self.body_signal, &mut self.body_load)
        } else {
            (&mut self.source_signal, &mut self.source_load)
        };
        self.carriers
            .replace(kind, id, sites, profile, signal, load);
    }
    pub(crate) fn reset_carriers(&mut self, kind: u8) {
        let (signal, load) = if kind == 0 {
            (&mut self.body_signal, &mut self.body_load)
        } else {
            (&mut self.source_signal, &mut self.source_load)
        };
        self.carriers.reset(kind, signal, load);
    }
}
