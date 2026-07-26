//! Styx OS Virtual Terminal Device Driver
//!
//! @file tty/mod.rs
//! @module StyxOS/Kernel/TTY
//! @description Ring buffer character device driver connecting terminal I/O streams to VFS nodes.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use std::sync::{Arc, RwLock};
use std::collections::VecDeque;
use crate::error::Result;
use crate::vfs::{VNode, FileStat, NodeType};

pub struct TtyDevice {
    in_buffer: RwLock<VecDeque<u8>>,
    out_buffer: RwLock<VecDeque<u8>>,
    raw_mode: RwLock<bool>,
}

impl TtyDevice {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            in_buffer: RwLock::new(VecDeque::new()),
            out_buffer: RwLock::new(VecDeque::new()),
            raw_mode: RwLock::new(false),
        })
    }

    pub fn write_input(&self, data: &[u8]) {
        let mut in_buf = self.in_buffer.write().unwrap();
        in_buf.extend(data);
    }

    pub fn read_output(&self, max_bytes: usize) -> Vec<u8> {
        let mut out_buf = self.out_buffer.write().unwrap();
        let count = max_bytes.min(out_buf.len());
        out_buf.drain(..count).collect()
    }

    pub fn set_raw_mode(&self, raw: bool) {
        *self.raw_mode.write().unwrap() = raw;
    }
}

impl VNode for TtyDevice {
    fn stat(&self) -> Result<FileStat> {
        Ok(FileStat {
            ino: 5,
            mode: 0o666,
            nlink: 1,
            uid: 0,
            gid: 0,
            size: 0,
            atime: 0,
            mtime: 0,
            ctime: 0,
            node_type: NodeType::CharDevice,
        })
    }

    fn read(&self, _offset: u64, buf: &mut [u8]) -> Result<usize> {
        let mut in_buf = self.in_buffer.write().unwrap();
        let to_copy = buf.len().min(in_buf.len());
        for i in 0..to_copy {
            buf[i] = in_buf.pop_front().unwrap();
        }
        Ok(to_copy)
    }

    fn write(&self, _offset: u64, buf: &[u8]) -> Result<usize> {
        let mut out_buf = self.out_buffer.write().unwrap();
        out_buf.extend(buf);
        Ok(buf.len())
    }

    fn truncate(&self, _size: u64) -> Result<()> {
        Ok(())
    }

    fn readdir(&self) -> Result<Vec<(String, FileStat)>> {
        Ok(vec![])
    }

    fn create_child(&self, _name: &str, _node_type: NodeType, _mode: u32) -> Result<Arc<dyn VNode>> {
        Err(crate::error::KernelError::Posix(crate::error::Errno::ENOTDIR))
    }

    fn lookup(&self, _name: &str) -> Result<Arc<dyn VNode>> {
        Err(crate::error::KernelError::Posix(crate::error::Errno::ENOTDIR))
    }

    fn remove_child(&self, _name: &str) -> Result<()> {
        Err(crate::error::KernelError::Posix(crate::error::Errno::ENOTDIR))
    }
}
