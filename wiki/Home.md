# Welcome to Styx OS Wiki

**Styx OS** (`Styx`) is an ultra-modern, Unix-like Operating System built with a **Rust WebAssembly Kernel Core** (`packages/kernel`) and a **TypeScript Host Shell & Graphical Web Desktop UI** (`packages/shell-ui`).

It provides full POSIX emulation, multi-user authentication, virtual memory & process execution, Glassmorphism Window Management, interactive desktop applications (Graphical Web Browser, File Explorer, Real-Time Process Monitor, Text Editor), and 55 POSIX kernel subsystem milestones.

---

## 🌟 Key Highlights

- **WebAssembly Kernel (`packages/kernel`)**: High-performance Rust WebAssembly kernel compiled with `wasm-pack` and target `wasm32-unknown-unknown`.
- **Graphical Web Desktop UI (`packages/shell-ui`)**: Glassmorphism Window Manager (`wm.ts`) with interactive windows:
  - 🌐 **Web Browser Window** (`browser.ts`): Built-in web client rendering HTML/CSS, iframe sandboxing, tabbed navigation, and address bar.
  - 📁 **File Explorer Window**: Interactive VFS directory browser with double-click text editing integration.
  - 📊 **Real-Time Process Monitor GUI Window**: Live task & CPU/memory monitoring inspector.
  - 📝 **Glassmorphism Text Editor**: Direct file editing with VFS write sync.
- **POSIX Subsystem Compatibility**: 55 completed milestones including:
  - Advisory File Locking (`flock`, `fcntl`, `lslocks`, `/proc/locks`).
  - Termios Line Discipline (`stty`, `tcgetattr`, `tcsetattr`, raw/sane modes).
  - Virtual Memory Mapping (`mmap`, `munmap`, `msync`, `mprotect`, `/proc/self/maps`).
  - System V & POSIX IPC Management (`ipcmk`, `ipcrm`, `ipcclean`, `ipcs -a`).
  - High-Resolution Time & Timers (`clock_gettime`, `nanosleep`, `timer_create`, `date`, `uptime`, `time`).
- **Comprehensive Test Coverage**: 161/161 passing Vitest unit & integration tests across 54 test suites.
- **Copyleft Licensing**: Licensed under the **GNU General Public License v3.0 or later (GPL-3.0-or-later)**.

---

## 📚 Navigation & Documentation

- [[Architecture]] - High-level system architecture and Rust WASM / TypeScript integration.
- [[POSIX-Subsystems]] - Complete list of 55 POSIX milestones & kernel modules.
- [[Getting-Started-&-Running-Guide]] - How to build, run dev server, test, and use Styx OS.
- [[API-&-Syscall-Reference]] - System call reference table and kernel module APIs.

---

## 📜 License & Copyleft Notice

```text
Styx OS Project
Copyright (C) 2026 Styx OS Project Authors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
```
