/**
 * @file sysinfo.test.ts
 * @module StyxOS/Kernel/SysInfoEngineTests
 * @description Vitest test suite for POSIX Extended System Information (sysinfo, uname, free, /proc/sysinfo) and /bin/sysinfo.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Extended System Information Test Suite", () => {
  it("should query system memory, RAM, swap, and uptime via sysinfo", () => {
    const kernel = new UnixKernel();
    const info = kernel.sysInfoEngine.sysinfo();

    expect(info.totalram).toBe(4 * 1024 * 1024 * 1024);
    expect(info.freeram).toBe(3 * 1024 * 1024 * 1024);
    expect(info.loads.length).toBe(3);
  });

  it("should generate uname system information, free RAM report, and /proc/sysinfo node", () => {
    const kernel = new UnixKernel();

    const unameText = kernel.sysInfoEngine.uname(["-a"]);
    expect(unameText).toContain("Linux");
    expect(unameText).toContain("wasm32");

    const freeText = kernel.sysInfoEngine.free(["-h"]);
    expect(freeText).toContain("Mem:");
    expect(freeText).toContain("Swap:");

    const procText = kernel.sysInfoEngine.formatProcSysinfo();
    expect(procText).toContain("uptime:");
    expect(procText).toContain("totalram:");
  });

  it("should execute /bin/sysinfo.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/sysinfo.wasm",
      ["/bin/sysinfo.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("System Information Tool");
  });
});
