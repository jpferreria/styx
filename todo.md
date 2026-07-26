# Styx OS Future Improvements & Feature Roadmap (`todo.md`)

This document outlines planned enhancements, architectural upgrades, and potential future milestones for **Styx OS** (the Web Worker / WASI Unix-compatible browser operating system).

---

## 🚀 1. System & Kernel Subsystems

- [ ] **Virtual Dynamic Shared Object Loader (`dlopen` / `/lib`):**
  - Implement dynamic WASI module loading and symbol linking for shared objects in `/lib` and `/usr/lib`.
- [ ] **Pseudoterminal Driver (`/dev/ptmx` & `/dev/pts/*`):**
  - Add full PTY support allowing terminal multiplexers (e.g., virtual `tmux` / `screen`) and multiple interactive shell sessions.
- [ ] **Web Worker Multi-Core Load Balancer:**
  - Dynamic Web Worker process pool auto-scaling based on host CPU core count (`navigator.hardwareConcurrency`).
- [ ] **Virtual Swap File Subsystem (`/var/swap`):**
  - Page-based VFS memory swapping using IndexedDB / OPFS storage when VFS memory bounds are reached.

---

## 🌐 2. Networking & Socket Communications

- [ ] **WebSocket Proxy Bridge Driver:**
  - Real TCP/IP socket tunneling over WebSocket relays to enable live external SSH connections, real HTTP fetching, and WebRTC peer streaming.
- [ ] **Dynamic DNS Resolver (`/etc/resolv.conf`):**
  - DNS lookup cache engine with configurable nameservers and TTL record expiration handling.
- [ ] **Virtual Network Interface Controller (`/sys/class/net/eth0`):**
  - Virtual Ethernet adapter stats tracking rx/tx packet metrics, bandwidth throttling, and network interface toggles (`ifconfig` / `ip addr`).

---

## 🖥️ 3. Desktop GUI & Window Manager (`wm.ts`)

- [ ] **Interactive Window Resizing:**
  - Drag-to-resize handles on all 4 window borders and corners with minimum canvas constraints.
- [ ] **Taskbar Window Minimization & Restore Toggles:**
  - Clickable taskbar badges to toggle minimizing and restoring active desktop windows.
- [ ] **Customizable Desktop Theme Engine:**
  - Built-in theme selector (Dark Glassmorphism, Cyberpunk Neon, Classic Retro UNIX, Light Mode) with CSS custom properties.
- [ ] **Desktop Wallpaper & File Icons:**
  - Customizable desktop background images and drag-and-drop file shortcuts on the desktop grid.

---

## 🛠️ 4. Developer Utilities & Shell Applications

- [ ] **In-Browser C / Wasm Compiler Toolchain (`/bin/wasm-cc`):**
  - Embedded lightweight C compiler (TCC/Clang Wasm target) compiling C source files directly into WASI executables inside VFS.
- [ ] **POSIX Shell Script Debugger (`sh -x`):**
  - Line-by-line script execution mode with variable inspection and breakpoint traps.
- [ ] **Interactive Visual VFS Search & Grep Dialog:**
  - GUI file finder dialog supporting regex pattern matching across all VFS directories.
- [ ] **System Backup & VFS Export Utility (`spkg export`):**
  - Single-click export of VFS user directories (`/home/user`) to `.tar.gz` archive files downloaded directly to the host machine.
