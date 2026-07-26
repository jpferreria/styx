//! Styx OS Virtual File System (VFS) Layer
//!
//! @file vfs/mod.rs
//! @module StyxOS/Kernel/VFS
//! @description VFS tree node abstractions, in-memory MemFS driver, and path resolution logic.
//!
//! Copyright (C) 2026 Styx OS Project Authors
//! Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
//! See <https://www.gnu.org/licenses/gpl-3.0.html> for copyleft licensing details.

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use serde::{Serialize, Deserialize};
use bitflags::bitflags;
use crate::error::{Errno, Result, KernelError};

bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
    pub struct OpenFlags: u32 {
        const RDONLY    = 0;
        const WRONLY    = 1;
        const RDWR      = 2;
        const CREAT     = 64;
        const EXCL      = 128;
        const TRUNC     = 512;
        const APPEND    = 1024;
        const DIRECTORY = 65536;
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeType {
    File,
    Directory,
    CharDevice,
    Pipe,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStat {
    pub ino: u64,
    pub mode: u32,
    pub nlink: u32,
    pub uid: u32,
    pub gid: u32,
    pub size: u64,
    pub atime: u64,
    pub mtime: u64,
    pub ctime: u64,
    pub node_type: NodeType,
}

pub trait VNode: Send + Sync {
    fn stat(&self) -> Result<FileStat>;
    fn read(&self, offset: u64, buf: &mut [u8]) -> Result<usize>;
    fn write(&self, offset: u64, buf: &[u8]) -> Result<usize>;
    fn truncate(&self, size: u64) -> Result<()>;
    fn readdir(&self) -> Result<Vec<(String, FileStat)>>;
    fn create_child(&self, name: &str, node_type: NodeType, mode: u32) -> Result<Arc<dyn VNode>>;
    fn lookup(&self, name: &str) -> Result<Arc<dyn VNode>>;
    fn remove_child(&self, name: &str) -> Result<()>;
}

pub struct MemFileNode {
    stat: RwLock<FileStat>,
    content: RwLock<Vec<u8>>,
    children: RwLock<HashMap<String, Arc<dyn VNode>>>,
}

impl MemFileNode {
    pub fn new_file(ino: u64, mode: u32, uid: u32, gid: u32) -> Arc<Self> {
        let now = 0;
        Arc::new(Self {
            stat: RwLock::new(FileStat {
                ino,
                mode,
                nlink: 1,
                uid,
                gid,
                size: 0,
                atime: now,
                mtime: now,
                ctime: now,
                node_type: NodeType::File,
            }),
            content: RwLock::new(Vec::new()),
            children: RwLock::new(HashMap::new()),
        })
    }

    pub fn new_dir(ino: u64, mode: u32, uid: u32, gid: u32) -> Arc<Self> {
        let now = 0;
        Arc::new(Self {
            stat: RwLock::new(FileStat {
                ino,
                mode,
                nlink: 2,
                uid,
                gid,
                size: 4096,
                atime: now,
                mtime: now,
                ctime: now,
                node_type: NodeType::Directory,
            }),
            content: RwLock::new(Vec::new()),
            children: RwLock::new(HashMap::new()),
        })
    }
}

impl VNode for MemFileNode {
    fn stat(&self) -> Result<FileStat> {
        Ok(self.stat.read().unwrap().clone())
    }

    fn read(&self, offset: u64, buf: &mut [u8]) -> Result<usize> {
        let content = self.content.read().unwrap();
        let offset = offset as usize;
        if offset >= content.len() {
            return Ok(0);
        }
        let to_copy = (content.len() - offset).min(buf.len());
        buf[..to_copy].copy_from_slice(&content[offset..offset + to_copy]);
        Ok(to_copy)
    }

    fn write(&self, offset: u64, buf: &[u8]) -> Result<usize> {
        let mut content = self.content.write().unwrap();
        let mut stat = self.stat.write().unwrap();
        let offset = offset as usize;
        
        if offset + buf.len() > content.len() {
            content.resize(offset + buf.len(), 0);
        }
        content[offset..offset + buf.len()].copy_from_slice(buf);
        stat.size = content.len() as u64;
        Ok(buf.len())
    }

    fn truncate(&self, size: u64) -> Result<()> {
        let mut content = self.content.write().unwrap();
        let mut stat = self.stat.write().unwrap();
        content.resize(size as usize, 0);
        stat.size = size;
        Ok(())
    }

    fn readdir(&self) -> Result<Vec<(String, FileStat)>> {
        let children = self.children.read().unwrap();
        let mut entries = Vec::new();
        for (name, node) in children.iter() {
            entries.push((name.clone(), node.stat()?));
        }
        Ok(entries)
    }

    fn create_child(&self, name: &str, node_type: NodeType, mode: u32) -> Result<Arc<dyn VNode>> {
        let mut children = self.children.write().unwrap();
        if children.contains_key(name) {
            return Err(KernelError::Posix(Errno::EEXIST));
        }

        let ino = (children.len() as u64) + 1000;
        let child: Arc<dyn VNode> = match node_type {
            NodeType::File => MemFileNode::new_file(ino, mode, 0, 0),
            NodeType::Directory => MemFileNode::new_dir(ino, mode, 0, 0),
            _ => return Err(KernelError::Posix(Errno::ENOSYS)),
        };

        children.insert(name.to_string(), child.clone());
        Ok(child)
    }

    fn lookup(&self, name: &str) -> Result<Arc<dyn VNode>> {
        let children = self.children.read().unwrap();
        children.get(name).cloned().ok_or(KernelError::Posix(Errno::ENOENT))
    }

    fn remove_child(&self, name: &str) -> Result<()> {
        let mut children = self.children.write().unwrap();
        children.remove(name).ok_or(KernelError::Posix(Errno::ENOENT))?;
        Ok(())
    }
}

pub struct VirtualFileSystem {
    root: Arc<dyn VNode>,
}

impl VirtualFileSystem {
    pub fn new() -> Self {
        let root = MemFileNode::new_dir(1, 0o755, 0, 0);
        root.create_child("dev", NodeType::Directory, 0o755).unwrap();
        root.create_child("tmp", NodeType::Directory, 0o777).unwrap();
        root.create_child("home", NodeType::Directory, 0o755).unwrap();
        
        let home = root.lookup("home").unwrap();
        home.create_child("user", NodeType::Directory, 0o755).unwrap();

        Self { root }
    }

    pub fn resolve_path(&self, path: &str) -> Result<Arc<dyn VNode>> {
        let path = path.trim_matches('/');
        if path.is_empty() {
            return Ok(self.root.clone());
        }

        let parts: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
        let mut curr = self.root.clone();

        for part in parts {
            if part == "." {
                continue;
            }
            if part == ".." {
                continue;
            }
            curr = curr.lookup(part)?;
        }

        Ok(curr)
    }
}
