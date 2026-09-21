use crate::{commands, world::World};
use serde_json::{Value, json};
use std::cell::RefCell;

#[derive(Default)]
struct Store {
    worlds: Vec<Option<World>>,
    reply: Vec<u8>,
    render: crate::render::Buffers,
    render_owner: Option<usize>,
}
impl Store {
    fn insert(&mut self, world: World) -> usize {
        self.render_owner = None;
        if let Some(i) = self.worlds.iter().position(Option::is_none) {
            self.worlds[i] = Some(world);
            i
        } else {
            self.worlds.push(Some(world));
            self.worlds.len() - 1
        }
    }
    fn request(&mut self, v: Value) -> Result<Vec<u8>, String> {
        // Replies are consumed by the caller before its next request. Reuse their
        // allocation space while constructing a potentially large checkpoint.
        self.reply = Vec::new();
        let op = v
            .get("op")
            .and_then(Value::as_str)
            .ok_or("Missing operation")?;
        let value = if op == "resourceEconomy" {
            crate::economy_report::report(
                v.get("seed").and_then(Value::as_u64).unwrap_or(101),
                serde_json::from_value(v.get("config").cloned().unwrap_or(json!({})))
                    .map_err(|e| e.to_string())?,
            )?
        } else if op == "chemistryAtlas" {
            crate::chemistry_atlas::atlas(v.get("seed").and_then(Value::as_u64).unwrap_or(101))?
        } else if op == "controllerChange" {
            let base = serde_json::from_value(
                v.get("genome")
                    .cloned()
                    .ok_or("Missing controller genome")?,
            )
            .map_err(|e| e.to_string())?;
            crate::controller::validate(&base)?;
            let changes = serde_json::from_value(
                v.get("changes")
                    .cloned()
                    .ok_or("Missing controller changes")?,
            )
            .map_err(|e| e.to_string())?;
            json!(crate::controller::diagnostics::change(&base, &changes)?)
        } else if op == "configuration" {
            commands::configuration(&v)?
        } else if op == "create" {
            let world = commands::create(&v)?;
            json!({"handle":self.insert(world)})
        } else {
            let handle = v
                .get("handle")
                .and_then(Value::as_u64)
                .ok_or("Missing world handle")? as usize;
            let world = self
                .worlds
                .get_mut(handle)
                .and_then(Option::as_mut)
                .ok_or("Unknown world handle")?;
            if op == "save" {
                return world.snapshot();
            }
            if op == "dispose" {
                self.worlds[handle] = None;
                json!({})
            } else {
                commands::execute(world, &v)?
            }
        };
        serde_json::to_vec(&value).map_err(|e| e.to_string())
    }
    fn result(&mut self, result: Result<Vec<u8>, String>) -> i32 {
        match result {
            Ok(bytes) => {
                self.reply = bytes;
                1
            }
            Err(message) => {
                self.reply = serde_json::to_vec(&json!({"error":message})).unwrap();
                0
            }
        }
    }
}
thread_local! {static STORE:RefCell<Store>=RefCell::new(Store::default());}

#[cfg(all(target_arch = "wasm32", not(feature = "threads")))]
#[link(wasm_import_module = "env")]
unsafe extern "C" {
    fn antropy_clock() -> f64;
}
pub fn clock() -> f64 {
    #[cfg(all(target_arch = "wasm32", feature = "threads"))]
    {
        browser_clock()
    }
    #[cfg(all(target_arch = "wasm32", not(feature = "threads")))]
    {
        unsafe { antropy_clock() }
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        static START: std::sync::OnceLock<std::time::Instant> = std::sync::OnceLock::new();
        START
            .get_or_init(std::time::Instant::now)
            .elapsed()
            .as_secs_f64()
            * 1000.
    }
}

#[cfg(all(target_arch = "wasm32", feature = "threads"))]
#[wasm_bindgen::prelude::wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = performance, js_name = now)]
    fn browser_clock() -> f64;
}

#[unsafe(no_mangle)]
pub extern "C" fn antropy_allocate(length: usize) -> *mut u8 {
    Box::into_raw(vec![0u8; length].into_boxed_slice()) as *mut u8
}
/// The caller returns the exact allocation and length obtained from antropy_allocate.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn antropy_free(pointer: *mut u8, length: usize) {
    unsafe {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
            pointer, length,
        )));
    }
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn antropy_request(pointer: *const u8, length: usize) -> i32 {
    let bytes = unsafe { std::slice::from_raw_parts(pointer, length) };
    STORE.with(|s| {
        let mut s = s.borrow_mut();
        let result = serde_json::from_slice(bytes)
            .map_err(|e| e.to_string())
            .and_then(|v| s.request(v));
        s.result(result)
    })
}
#[unsafe(no_mangle)]
pub unsafe extern "C" fn antropy_restore(pointer: *const u8, length: usize) -> i32 {
    let bytes = unsafe { std::slice::from_raw_parts(pointer, length) };
    STORE.with(|s| {
        let mut s = s.borrow_mut();
        s.reply = Vec::new();
        let result = World::restore(bytes).map(|w| {
            let handle = s.insert(w);
            serde_json::to_vec(&json!({"handle":handle})).unwrap()
        });
        s.result(result)
    })
}
#[unsafe(no_mangle)]
pub extern "C" fn antropy_reply_pointer() -> *const u8 {
    STORE.with(|s| s.borrow().reply.as_ptr())
}
#[unsafe(no_mangle)]
pub extern "C" fn antropy_reply_length() -> usize {
    STORE.with(|s| s.borrow().reply.len())
}

/// Scalar hot path. Negative values encode a stopped tick as -(tick + 1).
/// Errors return NaN; no request, reply, or JSON allocation occurs here.
#[unsafe(no_mangle)]
pub extern "C" fn antropy_step(handle: usize, count: u32) -> f64 {
    STORE.with(|s| {
        let mut store = s.borrow_mut();
        let Some(w) = store.worlds.get_mut(handle).and_then(Option::as_mut) else {
            return f64::NAN;
        };
        if count > 10000 {
            return f64::NAN;
        }
        for _ in 0..count {
            w.step();
            if w.stop_reason.is_some() {
                break;
            }
        }
        if w.stop_reason.is_some() {
            -(w.tick as f64 + 1.)
        } else {
            w.tick as f64
        }
    })
}

/// Returned views remain valid until another engine call; the owning worker draws before stepping.
#[unsafe(no_mangle)]
pub extern "C" fn antropy_render(
    handle: usize,
    kind: u32,
    species: usize,
    color: u32,
    field: u32,
    selected: u32,
) -> *const u32 {
    STORE.with(|s| {
        let mut store = s.borrow_mut();
        let Store {
            worlds,
            render,
            render_owner,
            ..
        } = &mut *store;
        let Some(w) = worlds.get(handle).and_then(Option::as_ref) else {
            return std::ptr::null();
        };
        if *render_owner != Some(handle) {
            render.colors = Default::default();
        }
        if render
            .prepare(
                w,
                kind,
                species,
                color,
                field != 0 || *render_owner != Some(handle),
                selected as u64,
            )
            .is_err()
        {
            return std::ptr::null();
        }
        *render_owner = Some(handle);
        render.descriptor.as_ptr()
    })
}
