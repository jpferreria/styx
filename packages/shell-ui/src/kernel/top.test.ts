/**
 * @file top.test.ts
 * @module StyxOS/ShellHost/SystemMonitorTests
 * @description Vitest test suite for SystemMonitor metrics engine, load averages, and /bin/top.wasm binary.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { SystemMonitor } from "../shell/top";

describe("Styx OS System Monitor Engine Test Suite", () => {
  it("should calculate valid system metrics (CPU, RAM, process count)", () => {
    const kernel = new UnixKernel();
    const monitor = new SystemMonitor(kernel);
    const metrics = monitor.getMetrics();

    expect(metrics.totalMemKb).toBe(4194304);
    expect(metrics.usedMemKb).toBeGreaterThan(0);
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.processCount).toBe(3);
  });

  it("should generate formatted top performance text report", () => {
    const kernel = new UnixKernel();
    const monitor = new SystemMonitor(kernel);
    const report = monitor.generateReport();

    expect(report).toContain("Styx OS Top");
    expect(report).toContain("%Cpu(s):");
    expect(report).toContain("MiB Mem :");
    expect(report).toContain("COMMAND");
  });

  it("should execute /bin/top.wasm via sys_execve and stream process list", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/top.wasm",
      ["/bin/top.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Styx OS Top");
  });
});
