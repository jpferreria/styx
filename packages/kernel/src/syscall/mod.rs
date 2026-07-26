//! Styx OS POSIX System Call Dispatcher
//!
//! @file syscall/mod.rs
//! @module StyxOS/Kernel/Syscall
//! @description Handlers and routing for core POSIX system calls (open, read, write, stat, mkdir, unlink).
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use std::sync::{Arc, RwLock};
use crate::error::{Errno, Result, KernelError};
use crate::vfs::{VirtualFileSystem, OpenFlags, FileStat, NodeType};
use crate::process::{ProcessControlBlock, Fd, OpenFile};
use crate::tty::TtyDevice;

pub struct SyscallDispatcher {
    pub vfs: Arc<VirtualFileSystem>,
    pub process: Arc<ProcessControlBlock>,
    pub tty: Arc<TtyDevice>,
}

impl SyscallDispatcher {
    pub fn new() -> Self {
        let vfs = Arc::new(VirtualFileSystem::new());
        let process = Arc::new(ProcessControlBlock::new(1, 0));
        let tty = TtyDevice::new();

        let mut fds = process.fds.write().unwrap();
        let open_tty = Arc::new(OpenFile {
            node: tty.clone(),
            offset: RwLock::new(0),
            flags: OpenFlags::RDWR,
        });

        fds.insert_at(0, open_tty.clone());
        fds.insert_at(1, open_tty.clone());
        fds.insert_at(2, open_tty.clone());

        Self { vfs, process, tty }
    }

    pub fn sys_open(&self, path: &str, flags: u32, mode: u32) -> Result<Fd> {
        let open_flags = OpenFlags::from_bits_truncate(flags);
        
        let node = match self.vfs.resolve_path(path) {
            Ok(node) => node,
            Err(KernelError::Posix(Errno::ENOENT)) if open_flags.contains(OpenFlags::CREAT) => {
                let (parent_path, filename) = match path.rfind('/') {
                    Some(idx) => (&path[..idx], &path[idx + 1..]),
                    None => ("", path),
                };
                let parent = self.vfs.resolve_path(parent_path)?;
                parent.create_child(filename, NodeType::File, mode)?
            }
            Err(e) => return Err(e),
        };

        let open_file = Arc::new(OpenFile {
            node,
            offset: RwLock::new(0),
            flags: open_flags,
        });

        let mut fds = self.process.fds.write().unwrap();
        Ok(fds.insert(open_file))
    }

    pub fn sys_read(&self, fd: Fd, buf: &mut [u8]) -> Result<usize> {
        let file = self.process.fds.read().unwrap().get(fd)?;
        let mut offset = file.offset.write().unwrap();
        let bytes_read = file.node.read(*offset, buf)?;
        *offset += bytes_read as u64;
        Ok(bytes_read)
    }

    pub fn sys_write(&self, fd: Fd, buf: &[u8]) -> Result<usize> {
        let file = self.process.fds.read().unwrap().get(fd)?;
        let mut offset = file.offset.write().unwrap();
        let bytes_written = file.node.write(*offset, buf)?;
        *offset += bytes_written as u64;
        Ok(bytes_written)
    }

    pub fn sys_close(&self, fd: Fd) -> Result<()> {
        let mut fds = self.process.fds.write().unwrap();
        fds.close(fd)
    }

    pub fn sys_stat(&self, path: &str) -> Result<FileStat> {
        let node = self.vfs.resolve_path(path)?;
        node.stat()
    }

    pub fn sys_fstat(&self, fd: Fd) -> Result<FileStat> {
        let file = self.process.fds.read().unwrap().get(fd)?;
        file.node.stat()
    }

    pub fn sys_mkdir(&self, path: &str, mode: u32) -> Result<()> {
        let (parent_path, dir_name) = match path.rfind('/') {
            Some(idx) => (&path[..idx], &path[idx + 1..]),
            None => ("", path),
        };
        let parent = self.vfs.resolve_path(parent_path)?;
        parent.create_child(dir_name, NodeType::Directory, mode)?;
        Ok(())
    }

    pub fn sys_readdir(&self, path: &str) -> Result<Vec<(String, FileStat)>> {
        let node = self.vfs.resolve_path(path)?;
        node.readdir()
    }

    pub fn sys_unlink(&self, path: &str) -> Result<()> {
        let (parent_path, filename) = match path.rfind('/') {
            Some(idx) => (&path[..idx], &path[idx + 1..]),
            None => ("", path),
        };
        let parent = self.vfs.resolve_path(parent_path)?;
        parent.remove_child(filename)
    }
}
