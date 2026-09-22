use crate::{chemistry::Chemistry, field::Field};

#[test]
fn unoccupied_area_adds_indices_without_chemical_rows_or_recurring_support() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut counts = Vec::new();
    for (width, height) in [(320., 240.), (1600., 480.), (1600., 960.)] {
        let mut field = Field::new(width, height, 2.);
        field.attraction_length = 6.;
        assert_eq!(field.amounts().nodes().len(), 0);
        assert_eq!(
            field.amounts().allocated_bytes(),
            field.nx.div_ceil(8) * field.ny.div_ceil(8) * 4
        );
        let site = 40 * field.nx + 50;
        field.add(site, 17, 10., &chemistry);
        field.add(site + 1, 170, 5., &chemistry);
        for _ in 0..4 {
            field.advance(&chemistry, 0.8, 0., 1.);
        }
        let info = field.structural_counts();
        counts.push((
            field.work_counts(),
            field.amounts().nodes().len(),
            info["attractionVisited"].clone(),
        ));
        assert!(field.amounts().nodes().len() < 100);
        let far = field.nx * field.ny - 1;
        assert!(field.amounts().row(far).iter().all(|q| *q == 0.));
        // Incoming material immediately creates an owner even outside every prior halo.
        field.add(far, 99, 1., &chemistry);
        field.advance(&chemistry, 0.8, 0., 1.);
        assert!(field.amounts()[99] > 0. || field.amounts()[(field.nx - 1) * 256 + 99] > 0.);
        field.validate_reductions(&chemistry).unwrap();
    }
    assert_eq!(counts[0], counts[1]);
    assert_eq!(counts[0], counts[2]);
}

#[test]
fn material_owner_reclaims_vanished_support_and_restore_keeps_sparse_ownership() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut field = Field::new(320., 240., 2.);
    for n in 0..1000 {
        field.add(n, 0, 1e-9, &chemistry);
    }
    let before = field.totals(&chemistry).0;
    let balance = field.advance(&chemistry, 0.8, 0., 1.);
    assert_eq!(field.amounts().nodes().len(), 0);
    assert!((before - balance.roundoff_matter).abs() < 1e-12);
    for _ in 0..20 {
        field.add(3, 100, 0.001, &chemistry);
    }
    field.advance(&chemistry, 0.8, 0., 1.);
    assert!(field.amounts()[3 * 256 + 100] > 0.);
    let bytes = postcard::to_stdvec(&field.amounts()).unwrap();
    assert!(bytes.len() < 10000);
    let restored: crate::spatial_material::Material = postcard::from_bytes(&bytes).unwrap();
    assert_eq!(&restored, field.amounts());
}

#[test]
fn isolated_exposed_cell_cannot_import_its_own_material() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.cells.truncate(1);
    w.cells[0].damage = 0.5;
    let graph = crate::interfaces::Graph::new(&w.cells, &w.config);
    assert!(graph.neighbors(0).is_empty());
    let mut allocation = crate::contact_exchange::Allocation::default();
    allocation.begin(1);
    allocation.request(0, &graph, &[1.; 256], &[1.; 256], u64::MAX);
    let mut exports = vec![[0.; 256]];
    allocation.allocate(&w.cells, &mut exports, &graph, &[0]);
    assert!(allocation.received[0].iter().all(|q| *q == 0.));
    assert!(allocation.withdrawn[0].iter().all(|q| *q == 0.));
}

#[test]
fn circle_contacts_have_no_lattice_anisotropy_or_heading_dependence() {
    let w = crate::diagnostics::nutrition(0.8, 2., false, false);
    let mut cells = vec![w.cells[0].clone(); 3];
    for (i, c) in cells.iter_mut().enumerate() {
        c.id = i as u64 + 1;
        c.x = 10. + i as f64 * 0.07;
        c.y = 10. - i as f64 * 0.02;
    }
    let mut cache = crate::movement::geometry::Cache::default();
    cache.prepare_local(&cells, &w.config);
    let original = cache.local.pressure.rows.clone();
    assert!(original.iter().any(|r| r.weight > 0.));
    let (sin, cos) = 0.731_f64.sin_cos();
    for cell in &mut cells {
        let x = cell.x - 10.;
        let y = cell.y - 10.;
        cell.x = 10. + cos * x - sin * y;
        cell.y = 10. + sin * x + cos * y;
        cell.heading += 1.3;
    }
    cache.prepare_local(&cells, &w.config);
    let mut total = [0.; 2];
    for (a, b) in original.iter().zip(&cache.local.pressure.rows) {
        assert!((a.weight - b.weight).abs() < 1e-12);
        assert!((cos * a.shift[0] - sin * a.shift[1] - b.shift[0]).abs() < 1e-12);
        assert!((sin * a.shift[0] + cos * a.shift[1] - b.shift[1]).abs() < 1e-12);
        for k in 0..2 {
            total[k] += b.shift[k];
        }
    }
    assert!(total.iter().all(|v| v.abs() < 1e-12));
}
