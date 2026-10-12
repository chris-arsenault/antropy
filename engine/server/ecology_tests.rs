use super::{ecology_store, runtime::Runtime};
use antropy_engine::{config::Config, world::World};
use serde_json::json;
use std::sync::Arc;

fn runtime() -> Runtime {
    Runtime::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 2,
            ..Default::default()
        },
        1,
    )
    .unwrap()
}

#[test]
fn extinction_retains_terminal_evidence_through_empty_time_and_world_replacement() {
    let mut r = runtime();
    for cell in &mut r.world.cells {
        cell.energy = 0.;
    }
    r.step();
    assert!(r.world.cells.is_empty());
    let ended = json!(r.ecology);
    assert_eq!(ended["runs"][0]["extinctAt"], 1);
    assert_eq!(ended["runs"][0]["endingsSeen"], 4);
    assert_eq!(
        ended["runs"][0]["endings"]["entries"]
            .as_array()
            .unwrap()
            .len(),
        4
    );
    for _ in 0..1000 {
        r.step();
    }
    assert_eq!(json!(r.ecology), ended);
    assert_eq!(
        r.ecology.report(&r.world, r.generation)["current"]["tick"],
        1001
    );
    r.replace(World::new(28, r.world.config.clone()).unwrap())
        .unwrap();
    let history = json!(r.ecology);
    assert_eq!(history["runs"].as_array().unwrap().len(), 2);
    assert_eq!(history["runs"][0], ended["runs"][0]);
    assert_eq!(history["runs"][1]["generation"], 2);
    assert_eq!(history["runs"][1]["seed"], 28);
    assert_eq!(history["runs"][1]["startedTick"], 0);
}

#[test]
fn durable_history_restores_and_failed_replacement_preserves_the_good_file() {
    let dir =
        std::env::temp_dir().join(format!("biotropy-ecology-roundtrip-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    let d = super::diagnostics::Diagnostics::open(&dir).unwrap();
    let mut r = runtime();
    d.save_ecology(&r.ecology).unwrap();
    let original = json!(r.ecology);
    let original_bytes = std::fs::read(d.ecology_path()).unwrap();
    let restored = json!(ecology_store::load(&d.ecology_path()));
    assert_eq!(restored["revision"], original["revision"]);
    assert_eq!(restored["runs"][0]["config"]["mortalityRecovery"], true);
    assert!(
        (restored["runs"][0]["recent"]["entries"][0]["global"]["cellEnergy"]
            .as_f64()
            .unwrap()
            - 2.)
            .abs()
            < 1e-12
    );
    r.world.tick += 250;
    r.ecology.observe(&mut r.world, false);
    let partial = d.ecology_path().with_extension("tmp");
    std::fs::create_dir(&partial).unwrap();
    assert!(d.save_ecology(&r.ecology).is_err());
    assert_eq!(std::fs::read(d.ecology_path()).unwrap(), original_bytes);
    std::fs::remove_dir(&partial).unwrap();
    d.save_ecology(&r.ecology).unwrap();
    let newer = std::fs::read(d.ecology_path()).unwrap();
    let stale = serde_json::from_value(original).unwrap();
    d.save_ecology(&stale).unwrap();
    assert_eq!(std::fs::read(d.ecology_path()).unwrap(), newer);
    std::fs::write(d.ecology_path(), b"corrupt gzip").unwrap();
    assert!(ecology_store::load(&d.ecology_path()).load_error.is_some());
    std::fs::remove_dir_all(dir).unwrap();
}

#[test]
fn history_reduces_old_points_and_expires_run_segments_with_visible_counts() {
    let mut r = runtime();
    for _ in 0..1200 {
        r.world.tick += 250;
        r.ecology.observe(&mut r.world, false);
    }
    let history = json!(r.ecology);
    assert!(
        history["runs"][0]["recent"]["entries"]
            .as_array()
            .unwrap()
            .len()
            <= 512
    );
    assert!(
        history["runs"][0]["overview"]["entries"]
            .as_array()
            .unwrap()
            .len()
            <= 256
    );
    assert!(history["runs"][0]["overviewStride"].as_u64().unwrap() > 1);
    assert_eq!(
        history["runs"][0]["overview"]["entries"][0]["global"]["tick"],
        0
    );
    for seed in 28..32 {
        r.replace(World::new(seed, r.world.config.clone()).unwrap())
            .unwrap();
    }
    assert_eq!(r.ecology.runs.len(), 3);
    assert_eq!(r.ecology.runs_expired, 2);
}

#[test]
fn large_source_sets_keep_global_evidence_and_rotate_bounded_local_detail() {
    let mut r = runtime();
    let source = r.world.sources[0].clone();
    r.world.sources.resize(300, source);
    r.world.ecology.as_mut().unwrap().local_endings = (0..300).map(|i| (i, [0, 1])).collect();
    let first = super::ecology_sample::point(&r.world);
    assert_eq!(first["neighborhoods"].as_array().unwrap().len(), 256);
    assert_eq!(first["neighborhoodsOmitted"], 44);
    assert_eq!(first["global"]["sources"]["count"], 300);
    assert_eq!(
        first["neighborhoods"][0]["topSupplyCondition"],
        first["neighborhoods"][0]["topMixture"]
    );
    r.world.tick += 250;
    let next = super::ecology_sample::point(&r.world);
    assert_ne!(
        first["neighborhoods"][0]["source"],
        next["neighborhoods"][0]["source"]
    );
}

#[tokio::test]
async fn private_ecology_endpoint_collects_without_spectators_and_flushes_to_volume() {
    use super::management_tests::{TOKEN, json_body, stored_fixture};
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use tower::ServiceExt;
    let dir = std::env::temp_dir().join(format!("biotropy-ecology-http-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    let diagnostics = super::diagnostics::Diagnostics::open(&dir).unwrap();
    let store = Arc::new(super::store::Store::open(&dir, u64::MAX).unwrap());
    let mut persistence = super::persistence::Persistence::new(store, None);
    persistence.diagnostics = Some(diagnostics.clone());
    let (app, host) = stored_fixture(Some(TOKEN), Some(persistence)).await;
    let request = |authorized: bool| {
        let mut r = Request::builder().uri("/api/ecology");
        if authorized {
            r = r.header("authorization", format!("Bearer {TOKEN}"));
        }
        app.clone().oneshot(r.body(Body::empty()).unwrap())
    };
    assert_eq!(
        request(false).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );
    let response = request(true).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(host.exports.available_permits(), 0);
    assert_eq!(
        request(true).await.unwrap().status(),
        StatusCode::SERVICE_UNAVAILABLE
    );
    assert_eq!(response.headers()["cache-control"], "no-store");
    let report = json_body(response).await;
    assert_eq!(host.exports.available_permits(), 1);
    assert_eq!(report["schema"], 1);
    assert!(report["current"]["ledger"]["flows"]["maintenance"].is_number());
    assert_eq!(report["history"]["runs"].as_array().unwrap().len(), 1);
    assert!(host.views.lock().unwrap().is_empty());
    host.flush_ecology().await.unwrap();
    assert!(diagnostics.ecology_path().exists());
    assert_eq!(
        ecology_store::load(&diagnostics.ecology_path()).runs.len(),
        1
    );
    drop(app);
    drop(host);
    std::fs::remove_dir_all(dir).unwrap();
}
