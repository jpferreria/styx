/**
 * @file procfs.test.ts
 * @module StyxOS/Kernel/ProcFSTests
 * @description Vitest test suite for virtual /proc filesystem, process lifecycle syscalls, and ps/kill binaries.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS ProcFS & Process Lifecycle Test Suite", () => {
  it("should read dynamic system metrics from /proc virtual files", () => {
    const kernel = new UnixKernel();

    const fdCpu = kernel.sys_open("/proc/cpuinfo", false);
    const cpuinfo = new TextDecoder().decode(kernel.sys_read(fdCpu, 1024));
    kernel.sys_close(fdCpu);
    expect(cpuinfo).toContain("WebAssembly 32-bit");

    const fdMem = kernel.sys_open("/proc/meminfo", false);
    const meminfo = new TextDecoder().decode(kernel.sys_read(fdMem, 1024));
    kernel.sys_close(fdMem);
    expect(meminfo).toContain("MemTotal:");

    const fdStatus = kernel.sys_open("/proc/1/status", false);
    const status = new TextDecoder().decode(kernel.sys_read(fdStatus, 1024));
    kernel.sys_close(fdStatus);
    expect(status).toContain("Name:\tsh");
  });

  it("should fetch PID with sys_getpid and handle process signaling with sys_kill", () => {
    const kernel = new UnixKernel();
    expect(kernel.sys_getpid()).toBe(1);

    // Killing init process PID 1 should be forbidden
    expect(() => kernel.sys_kill(1)).toThrowError(/Cannot kill init process/);

    // Killing other PIDs should succeed
    expect(() => kernel.sys_kill(42)).not.toThrow();
  });

  it("should execute /bin/ps.wasm via sys_execve and output process table", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ps.wasm",
      ["/bin/ps.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("PID TTY");
    expect(stdout).toContain("sh");
  });
});
