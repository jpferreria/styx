# Styx OS Test Suite Breakdown (74/74 Tests Passed)

This document provides a detailed technical description of all **26 Vitest test files** and **74 automated unit/integration test cases** that verify **Styx OS**.

---

## Test Suite Execution Summary

- **Total Test Files:** `26 passed (26)`
- **Total Test Cases:** `74 passed (74)`
- **Test Runner:** Vitest v1.6.1
- **Pass Rate:** 100%

---

## Detailed Test Files & Case Specifications

### 1. `src/kernel/kernel.test.ts` (4 Tests)
- `should create and resolve VFS directory structure`: Verifies `createChild` and `resolvePath` navigation.
- `should read and write file node data`: Tests `sys_open`, `sys_write`, `sys_read`, and `sys_close` operations.
- `should handle capabilities and security checks`: Validates security permission bitmasks.
- `should generate valid process PIDs`: Verifies PID allocation logic.

### 2. `src/kernel/pipeline.test.ts` (3 Tests)
- `should parse shell commands with pipelines and redirection`: Tests parsing `|`, `>`, `>>`, `<`.
- `should execute single command stage`: Validates execution callback pipeline.
- `should pass data through pipe stages`: Tests byte transmission between pipeline stages.

### 3. `src/kernel/user.test.ts` (3 Tests)
- `should parse and read /etc/passwd and /etc/shadow system files`: Verifies account node parsing.
- `should fetch UID/GID and switch user context via sys_setuid`: Tests `sys_setuid` and user credentials.
- `should authenticate users and handle su / sudo operations`: Tests password validation and root elevation.

### 4. `src/kernel/procfs.test.ts` (3 Tests)
- `should mount /proc virtual directory`: Verifies `/proc` VFS node existence.
- `should generate dynamic /proc/cpuinfo and /proc/meminfo content`: Tests `/proc` metrics rendering.
- `should list running processes in /proc/<pid>/status`: Validates process status node generation.

### 5. `src/kernel/framebuffer.test.ts` (3 Tests)
- `should create /dev/fb0 device node`: Verifies `/dev/fb0` VFS registration.
- `should read and write RGBA frame buffer memory`: Tests pixel memory writes.
- `should trigger frame update listener`: Validates HTML5 Canvas frame render callback.

### 6. `src/kernel/installer.test.ts` (3 Tests)
- `should validate WebAssembly binary magic header`: Verifies `\0asm` magic header check.
- `should install binary file into /bin directory`: Tests saving executable into `/bin`.
- `should list installed binaries`: Validates executable listing.

### 7. `src/kernel/socket.test.ts` (2 Tests)
- `should allocate a socket descriptor and connect to a remote endpoint`: Tests virtual socket allocation.
- `should execute /bin/curl.wasm via sys_execve and output network data`: Tests WASI binary execution over virtual socket.

### 8. `src/kernel/script.test.ts` (3 Tests)
- `should parse and execute simple shell commands`: Tests multi-line script execution.
- `should handle variable assignments and evaluation`: Tests `$VAR` script expansion.
- `should execute conditional if/then/fi blocks`: Tests conditional control flow.

### 9. `src/kernel/pkg.test.ts` (3 Tests)
- `should list available and installed packages`: Tests package metadata queries.
- `should install and remove packages`: Tests package binary installation.
- `should update package repository mirror index`: Tests `spkg update` and `/etc/spkg.conf`.

### 10. `src/kernel/editor.test.ts` (2 Tests)
- `should load file content into editor buffer`: Tests reading file into editor buffer.
- `should save modified buffer back to VFS`: Tests writing edited content to disk.

### 11. `src/kernel/top.test.ts` (3 Tests)
- `should calculate valid system metrics (CPU, RAM, process count)`: Tests resource calculation.
- `should generate formatted top performance text report`: Tests report formatting.
- `should execute /bin/top.wasm via sys_execve and stream process list`: Tests WASI `top` execution.

### 12. `src/kernel/audio.test.ts` (3 Tests)
- `should mount /dev/dsp device node`: Verifies `/dev/dsp` node registration.
- `should write PCM audio samples to device`: Tests audio buffer writing.
- `should trigger frequency tone generator`: Validates Web Audio tone synthesis.

### 13. `src/kernel/env.test.ts` (3 Tests)
- `should read initial environment variables from /etc/environment`: Tests `/etc/environment` parsing.
- `should set and unset environment variables via sys_setenv and sys_unsetenv`: Tests `export` and `unset`.
- `should format environment variable list`: Tests `env` text output.

### 14. `src/kernel/random.test.ts` (3 Tests)
- `should mount /dev/urandom and /dev/random stream nodes`: Verifies random node registration.
- `should read cryptographic random bytes`: Tests random byte generation.
- `should execute /bin/rand.wasm via sys_execve`: Tests WASI random byte streaming.

### 15. `src/kernel/signal.test.ts` (3 Tests)
- `should register POSIX signal handlers`: Tests `sys_signal` registration.
- `should dispatch SIGINT signal to target PID`: Tests `sys_kill` signal dispatch.
- `should execute /bin/signal.wasm via sys_execve`: Tests WASI signal trap execution.

### 16. `src/kernel/archive.test.ts` (3 Tests)
- `should create USTAR tarball archive from VFS files`: Tests tarball creation.
- `should unpack USTAR tarball archive`: Tests tarball extraction.
- `should execute /bin/tar.wasm and /bin/gzip.wasm`: Tests WASI archive executables.

### 17. `src/kernel/net.test.ts` (3 Tests)
- `should resolve hostnames using /etc/hosts`: Tests `/etc/hosts` resolution.
- `should calculate ICMP echo latency statistics`: Tests ping latency metrics.
- `should execute /bin/ping.wasm via sys_execve`: Tests WASI ping execution.

### 18. `src/kernel/cron.test.ts` (3 Tests)
- `should parse /etc/crontab file entries`: Tests crontab parsing.
- `should schedule background task execution`: Tests virtual task scheduling.
- `should execute /bin/cron.wasm via sys_execve`: Tests WASI cron execution.

### 19. `src/kernel/log.test.ts` (3 Tests)
- `should log system events to /var/log/syslog`: Tests system logging.
- `should capture kernel ring buffer dmesg log entries`: Tests ring buffer logging.
- `should execute /bin/dmesg.wasm via sys_execve`: Tests WASI dmesg execution.

### 20. `src/kernel/history.test.ts` (3 Tests)
- `should log executed commands to ~/.bash_history`: Tests history file logging.
- `should auto-complete command line inputs on Tab key`: Tests Tab auto-completion.
- `should execute /bin/history.wasm via sys_execve`: Tests WASI history execution.

### 21. `src/kernel/bench.test.ts` (2 Tests)
- `should execute system benchmark suite (VFS throughput, memory, syscall latency)`: Tests benchmark engine.
- `should execute /bin/bench.wasm via sys_execve`: Tests WASI bench execution.

### 22. `src/kernel/sysfs.test.ts` (3 Tests)
- `should mount /sys hierarchy in VFS tree`: Tests `/sys` VFS node tree.
- `should list virtual PCI and USB hardware devices`: Tests `lspci` and `lsusb` probe queries.
- `should execute /bin/lspci.wasm via sys_execve`: Tests WASI lspci execution.

### 23. `src/kernel/man.test.ts` (3 Tests)
- `should read /usr/share/man/man1/spkg.1 man page file from VFS`: Tests `/usr/share/man` VFS file reading.
- `should format POSIX manual pages for target commands`: Tests manual page formatting.
- `should execute /bin/man.wasm via sys_execve`: Tests WASI man execution.

### 24. `src/kernel/wm.test.ts` (3 Tests)
- `should create desktop window with title bar controls`: Tests WindowManager DOM creation.
- `should format taskbar tray clock time`: Tests `getFormattedTime` taskbar clock formatting.
- `should dispatch desktop notification toasts`: Tests `sendNotification` toast rendering.

### 25. `src/kernel/binaries.test.ts` (2 Tests)
- `should create valid WASI WebAssembly binaries`: Tests binary generators.
- `should verify binary headers`: Validates binary output structures.

### 26. `src/kernel/integration.test.ts` (2 Tests)
- `should execute end-to-end POSIX process pipeline`: Tests complete shell pipeline integration.
- `should verify multi-process execution stability`: Tests kernel stability under load.
