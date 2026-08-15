# Welcome to Styx OS Wiki

**Styx OS** (`Styx`) is a Unix-like Operating System built with a **WebAssembly & TypeScript Microkernel** (`packages/shell-ui`).

It provides POSIX emulation, multi-user authentication, virtual memory & process execution, Window Management, interactive desktop applications (Web Browser, VFS File Finder, Real-Time Process Monitor, Text Editor), Local LLM Server, EXT4 OPFS block storage, and 77 POSIX kernel subsystem milestones.

---

## Key Highlights

- **WebAssembly & TypeScript Kernel Core**: POSIX microkernel execution runtime with WASI 0.1 and WASI 0.2 Component Model WIT loader.
- **Graphical Web Desktop UI**: Window Manager (`wm.ts`) with interactive desktop windows:
  - **Web Browser Window** (`browser.ts`): Web client rendering HTML/CSS, iframe sandboxing, tabbed navigation, and address bar.
  - **VFS File Finder Window** (`wm.ts`): Interactive VFS file search window with live text/regex search filtering and directory previews.
  - **Real-Time Process Monitor GUI Window**: Live task, CPU, and memory monitoring inspector.
  - **Glassmorphism Text Editor**: Direct file editing with VFS write sync.
- **POSIX Subsystem Compatibility**: 77 completed milestones including:
  - Local LLM REST/RPC Agent Server (`/v1/chat/completions`, `ws://localhost:8080/rpc`).
  - Virtual EXT4 Block Storage Driver & OPFS Persistence (`/dev/sda`).
  - Terminal Session Multiplexer (`tmux`).
  - Dynamic Shared Object Loader (`dlopen`).
  - Shell Script Debugger (`sh -x`).
- **Comprehensive Test Coverage**: 205/205 passing Vitest unit & integration tests across 67 test files.
- **Copyleft Licensing**: Licensed under the **GNU General Public License v3.0 or later (GPL-3.0-or-later)**.

---

## Navigation & Documentation

- [[Architecture]] - High-level system architecture and WASI / TypeScript integration.
- [[POSIX-Subsystems]] - Complete list of 77 POSIX milestones & kernel modules.
- [[Getting-Started-&-Running-Guide]] - How to build, run dev server, test, and use Styx OS.
- [[API-&-Syscall-Reference]] - System call reference table and kernel module APIs.

---

## License & Copyleft Notice

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
