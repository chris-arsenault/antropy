use super::{
    management_tests::{TOKEN, json_body, stored_fixture},
    persistence::Persistence,
    store::{AUTOMATIC, Capture, MANUAL, Meta, Reason, Store, StoreError, retained},
};
use antropy_engine::{config::Config, world::World};
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Response,
};
use serde_json::{Value, json};
use std::{path::PathBuf, sync::Arc};
use tower::ServiceExt;

struct Dir(PathBuf);
impl Dir {
    fn new(name: &str) -> Self {
        let path = std::env::temp_dir().join(format!("biotropy-{name}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&path);
        Self(path)
    }
}
impl Drop for Dir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn world() -> World {
    World::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 2,
            ..Default::default()
        },
    )
    .unwrap()
}
fn capture(world: &World, reason: Reason) -> Capture {
    Capture {
        raw: world.snapshot().unwrap(),
        reason,
        seed: world.seed,
        tick: world.tick,
        generation: 1,
        population: world.cells.len(),
    }
}
fn meta(id: &str, reason: Reason, created_at: u64, bytes: u64) -> Meta {
    Meta {
        id: id.into(),
        reason,
        version: 40,
        seed: 27,
        tick: 0,
        generation: 1,
        population: 0,
        created_at,
        bytes,
        raw_bytes: bytes,
    }
}

#[test]
fn retention_keeps_newest_all_manual_and_six_automatic_within_budget() {
    let mut entries: Vec<_> = (0..10)
        .map(|i| meta(&format!("automatic-{i}"), Reason::Automatic, 100 - i, 10))
        .collect();
    entries.insert(3, meta("manual-a", Reason::Manual, 97, 10));
    let keep = retained(&entries, 1000);
    assert!(keep.contains("manual-a"));
    assert_eq!(keep.len(), 1 + AUTOMATIC);
    assert!(keep.contains("automatic-0") && keep.contains("automatic-5"));
    assert!(!keep.contains("automatic-6"));
    // A tight budget still keeps the newest state and every manual checkpoint.
    let keep = retained(&entries, 25);
    assert_eq!(keep, ["automatic-0", "manual-a"].map(String::from).into());
}

#[test]
fn store_round_trips_prunes_and_enforces_manual_quota() {
    let dir = Dir::new("store");
    let store = Store::open(&dir.0, u64::MAX).unwrap();
    let mut w = world();
    let first = store.write(capture(&w, Reason::Manual)).unwrap();
    w.step();
    for _ in 0..AUTOMATIC + 2 {
        store.write(capture(&w, Reason::Automatic)).unwrap();
    }
    let listed = store.list().unwrap();
    assert_eq!(listed.len(), 1 + AUTOMATIC);
    assert_eq!(listed.last().unwrap().id, first.id);
    let (meta, raw) = store.read(&first.id).unwrap();
    assert_eq!(meta.tick, 0);
    assert_eq!(World::restore(&raw).unwrap().tick, 0);
    assert!(matches!(store.read("../escape"), Err(StoreError::Missing)));
    for _ in 1..MANUAL {
        store.write(capture(&w, Reason::Manual)).unwrap();
    }
    assert!(matches!(
        store.write(capture(&w, Reason::Manual)),
        Err(StoreError::Full)
    ));
    store.delete(&first.id).unwrap();
    assert!(matches!(store.delete(&first.id), Err(StoreError::Missing)));
    store.write(capture(&w, Reason::Manual)).unwrap();
}

#[test]
fn launch_restore_skips_other_formats_and_corrupt_data_and_cleans_partials() {
    let dir = Dir::new("restore");
    let store = Store::open(&dir.0, u64::MAX).unwrap();
    let mut w = world();
    w.step();
    let good = store.write(capture(&w, Reason::Automatic)).unwrap();
    w.step();
    let migrated = store.write(capture(&w, Reason::Automatic)).unwrap();
    let path = dir.0.join(format!("{}.json", migrated.id));
    let mut old = migrated.clone();
    old.version = 39;
    std::fs::write(&path, serde_json::to_vec(&old).unwrap()).unwrap();
    w.step();
    let corrupt = store.write(capture(&w, Reason::Automatic)).unwrap();
    let data = dir.0.join(format!("{}.bin.gz", corrupt.id));
    let mut bytes = std::fs::read(&data).unwrap();
    bytes[20] ^= 0xff;
    std::fs::write(&data, &bytes).unwrap();
    std::fs::write(dir.0.join("partial.bin.gz.tmp"), b"x").unwrap();
    std::fs::write(dir.0.join("automatic-9-t9.bin.gz"), b"x").unwrap();
    let store = Store::open(&dir.0, u64::MAX).unwrap();
    assert!(!dir.0.join("partial.bin.gz.tmp").exists());
    assert!(!dir.0.join("automatic-9-t9.bin.gz").exists());
    let (meta, restored) = store.restore_latest().unwrap();
    assert_eq!(meta.id, good.id);
    assert_eq!(restored.tick, 1);
    // Incompatible checkpoints are listed for the operator, never deleted by launch.
    assert_eq!(store.list().unwrap().len(), 3);
}

#[test]
fn autosave_writes_changed_worlds_only_and_off_the_owner_thread() {
    use super::{persistence::Autosave, runtime::Runtime};
    let dir = Dir::new("autosave");
    let persistence = Persistence::new(
        Arc::new(Store::open(&dir.0, u64::MAX).unwrap()),
        Some(std::time::Duration::ZERO),
    );
    let saves = Arc::new(tokio::sync::Semaphore::new(1));
    let mut runtime = Runtime::from_world(world(), 1).unwrap();
    let mut autosave = Autosave::new(persistence.clone(), &runtime);
    autosave.poll(&mut runtime, &saves);
    assert_eq!(
        saves.available_permits(),
        1,
        "an unchanged world is not saved"
    );
    assert!(persistence.last().is_null());
    runtime.world.step();
    autosave.poll(&mut runtime, &saves);
    while saves.available_permits() == 0 {
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
    let listed = persistence.store.list().unwrap();
    assert_eq!(listed.len(), 1);
    assert_eq!((listed[0].reason, listed[0].tick), (Reason::Automatic, 1));
    let last = persistence.last();
    assert_eq!(
        (last["ok"].clone(), last["tick"].clone()),
        (json!(true), json!(1))
    );
    assert_eq!(last["checkpoint"]["id"], json!(listed[0].id));
    autosave.poll(&mut runtime, &saves);
    assert_eq!(saves.available_permits(), 1);
}

#[test]
fn each_boot_records_the_previous_heartbeat_and_panic() {
    use super::diagnostics::Diagnostics;
    let dir = Dir::new("diagnostics");
    let first = Diagnostics::open(&dir.0).unwrap();
    assert!(first.report()["boot"]["previousHeartbeat"].is_null());
    first.heartbeat(json!({"tick":41,"population":7}));
    // A panic record left by the previous process is reported once, then cleared.
    std::fs::write(
        dir.0.join("diagnostics/panic.json"),
        json!({"message":"boom"}).to_string(),
    )
    .unwrap();
    let second = Diagnostics::open(&dir.0).unwrap();
    let report = second.report();
    assert_eq!(report["boot"]["previousHeartbeat"]["progress"]["tick"], 41);
    assert_eq!(report["boot"]["previousPanic"]["message"], "boom");
    assert_eq!(report["recentBoots"].as_array().unwrap().len(), 2);
    assert!(!dir.0.join("diagnostics/panic.json").exists());
    let third = Diagnostics::open(&dir.0).unwrap();
    assert!(third.report()["boot"]["previousPanic"].is_null());
    assert!(report["memory"].is_object());
}

async fn call(app: &Router, method: &str, path: &str, body: Option<Value>) -> Response {
    let request = Request::builder()
        .method(method)
        .uri(path)
        .header("authorization", format!("Bearer {TOKEN}"))
        .header("content-type", "application/json");
    let body = body.map_or(Body::empty(), |v| Body::from(v.to_string()));
    app.clone()
        .oneshot(request.body(body).unwrap())
        .await
        .unwrap()
}

#[tokio::test]
async fn operator_saves_lists_loads_and_deletes_stored_worlds() {
    let dir = Dir::new("http");
    let persistence = Persistence::new(Arc::new(Store::open(&dir.0, u64::MAX).unwrap()), None);
    let (app, host) = stored_fixture(Some(TOKEN), Some(persistence.clone())).await;
    let saved = call(
        &app,
        "POST",
        "/api/checkpoints",
        Some(json!({"generation":1})),
    )
    .await;
    assert_eq!(saved.status(), StatusCode::CREATED);
    let saved = json_body(saved).await;
    assert_eq!(saved["reason"], "manual");
    let status = json_body(call(&app, "GET", "/api/status", None).await).await;
    let last = &status["persistence"]["lastSave"];
    assert_eq!(
        (last["ok"].clone(), last["reason"].clone()),
        (json!(true), json!("manual"))
    );
    assert_eq!(last["checkpoint"]["id"], saved["id"]);
    // Diagnostics need the volume boot record, which this fixture does not open.
    let diagnostics = call(&app, "GET", "/api/diagnostics", None).await;
    assert_eq!(diagnostics.status(), StatusCode::NOT_IMPLEMENTED);
    let id = saved["id"].as_str().unwrap().to_string();
    host.command(1, "step", json!({})).await.unwrap();
    let listed = json_body(call(&app, "GET", "/api/checkpoints", None).await).await;
    assert_eq!(listed["checkpoints"][0]["id"], id);
    assert_eq!(listed["checkpoints"][0]["compatible"], true);
    let stale = call(
        &app,
        "POST",
        &format!("/api/checkpoints/{id}/load"),
        Some(json!({"generation":2})),
    )
    .await;
    assert_eq!(stale.status(), StatusCode::CONFLICT);
    let loaded = call(
        &app,
        "POST",
        &format!("/api/checkpoints/{id}/load"),
        Some(json!({"generation":1})),
    )
    .await;
    assert_eq!(loaded.status(), StatusCode::OK);
    let loaded = json_body(loaded).await;
    assert_eq!(loaded["status"]["generation"], 2);
    assert_eq!(loaded["status"]["tick"], saved["tick"]);
    assert_eq!(loaded["checkpoint"]["id"], id);
    let deleted = call(&app, "DELETE", &format!("/api/checkpoints/{id}"), None).await;
    assert_eq!(deleted.status(), StatusCode::NO_CONTENT);
    let missing = call(
        &app,
        "POST",
        &format!("/api/checkpoints/{id}/load"),
        Some(json!({"generation":2})),
    )
    .await;
    assert_eq!(missing.status(), StatusCode::NOT_FOUND);
    // A later launch with the same volume resumes from the newest compatible save.
    let shutdown = host.save(None, Reason::Automatic, true).await.unwrap();
    let (relaunched, _) = stored_fixture(Some(TOKEN), Some(persistence)).await;
    let status = json_body(call(&relaunched, "GET", "/api/status", None).await).await;
    assert_eq!(status["tick"], shutdown.tick);
    let (disabled, _) = stored_fixture(Some(TOKEN), None).await;
    let off = call(&disabled, "GET", "/api/checkpoints", None).await;
    assert_eq!(off.status(), StatusCode::NOT_IMPLEMENTED);
    let unauthenticated = disabled
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/checkpoints")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(unauthenticated.status(), StatusCode::UNAUTHORIZED);
}
