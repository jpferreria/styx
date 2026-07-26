//! Styx OS Kernel Core WebAssembly Engine
//!
//! @file lib.rs
//! @module StyxOS/KernelCore
//! @description Primary Rust entrypoint exporting POSIX system call dispatchers and VFS bindings to Wasm.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

pub mod error;
pub mod security;
pub mod vfs;
pub mod process;
pub mod tty;
pub mod syscall;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use syscall::SyscallDispatcher;

#[derive(Serialize, Deserialize)]
pub struct StatJs {
    pub ino: u64,
    pub mode: u32,
    pub size: u64,
    pub is_dir: bool,
}

#[derive(Serialize, Deserialize)]
pub struct DirEntryJs {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
}

#[wasm_bindgen]
pub struct KernelEngine {
    dispatcher: SyscallDispatcher,
}

#[wasm_bindgen]
impl KernelEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        Self {
            dispatcher: SyscallDispatcher::new(),
        }
    }

    pub fn sys_open(&self, path: &str, flags: u32, mode: u32) -> Result<i32, JsValue> {
        self.dispatcher
            .sys_open(path, flags, mode)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn sys_read(&self, fd: i32, count: usize) -> Result<Vec<u8>, JsValue> {
        let mut buf = vec![0u8; count];
        let bytes_read = self.dispatcher
            .sys_read(fd, &mut buf)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        buf.truncate(bytes_read);
        Ok(buf)
    }

    pub fn sys_write(&self, fd: i32, data: &[u8]) -> Result<usize, JsValue> {
        self.dispatcher
            .sys_write(fd, data)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn sys_close(&self, fd: i32) -> Result<(), JsValue> {
        self.dispatcher
            .sys_close(fd)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn sys_mkdir(&self, path: &str, mode: u32) -> Result<(), JsValue> {
        self.dispatcher
            .sys_mkdir(path, mode)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn sys_stat(&self, path: &str) -> Result<JsValue, JsValue> {
        let stat = self.dispatcher
            .sys_stat(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let res = StatJs {
            ino: stat.ino,
            mode: stat.mode,
            size: stat.size,
            is_dir: stat.node_type == vfs::NodeType::Directory,
        };

        serde_wasm_bindgen::to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn sys_readdir(&self, path: &str) -> Result<JsValue, JsValue> {
        let entries = self.dispatcher
            .sys_readdir(path)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let js_entries: Vec<DirEntryJs> = entries
            .into_iter()
            .map(|(name, stat)| DirEntryJs {
                name,
                is_dir: stat.node_type == vfs::NodeType::Directory,
                size: stat.size,
            })
            .collect();

        serde_wasm_bindgen::to_value(&js_entries).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    pub fn tty_write_input(&self, data: &[u8]) {
        self.dispatcher.tty.write_input(data);
    }

    pub fn tty_read_output(&self, max_bytes: usize) -> Vec<u8> {
        self.dispatcher.tty.read_output(max_bytes)
    }

    pub fn run_posix_tests(&self) -> String {
        let mut report = String::from("=== POSIX Conformance Test Suite Output ===\n");
        let tests = vec![
            ("test_mkdir_and_stat", || {
                self.sys_mkdir("/tmp/posix_test_dir", 0o755)?;
                let stat = self.dispatcher.sys_stat("/tmp/posix_test_dir")?;
                if stat.node_type == vfs::NodeType::Directory { Ok(()) } else { Err("Not dir".into()) }
            }),
            ("test_file_write_and_read", || {
                let fd = self.sys_open("/tmp/posix_file.txt", 64 | 2, 0o644)?;
                self.sys_write(fd, b"Hello POSIX!")?;
                self.sys_close(fd)?;

                let fd2 = self.sys_open("/tmp/posix_file.txt", 0, 0)?;
                let content = self.sys_read(fd2, 100)?;
                self.sys_close(fd2)?;

                if content == b"Hello POSIX!" { Ok(()) } else { Err("Content mismatch".into()) }
            }),
        ];

        let mut passed = 0;
        let total = tests.len();
        for (name, test_fn) in tests {
            match test_fn() {
                Ok(_) => {
                    report.push_str(&format!("[PASS] {}\n", name));
                    passed += 1;
                }
                Err(err) => {
                    report.push_str(&format!("[FAIL] {}: {:?}\n", name, err));
                }
            }
        }

        report.push_str(&format!("Summary: {}/{} tests passed.\n", passed, total));
        report
    }
}
