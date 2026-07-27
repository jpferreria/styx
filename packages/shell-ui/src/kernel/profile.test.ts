/**
 * @file profile.test.ts
 * @module StyxOS/Kernel/ProfilerEngineTests
 * @description Vitest test suite for ProfilerEngine CPU, Disk VFS I/O, Memory performance benchmarks, and /bin/sysbench.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS System Performance Profiler Test Suite", () => {
  it("should run CPU prime benchmark and calculate ops per sec", () => {
    const kernel = new UnixKernel();
    const res = kernel.profilerEngine.runCpuBenchmark(1000);

    expect(res).toBeDefined();
    expect(res.ops).toBeGreaterThan(0);
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should run VFS Disk throughput benchmark and Memory allocation benchmark", () => {
    const kernel = new UnixKernel();

    const diskRes = kernel.profilerEngine.runDiskBenchmark();
    expect(diskRes.throughputMBs).toBeGreaterThan(0);

    const memRes = kernel.profilerEngine.runMemoryBenchmark();
    expect(memRes.throughputMBs).toBeGreaterThan(0);
  });

  it("should format sysbench reports for cpu, disk, and memory", () => {
    const kernel = new UnixKernel();

    const cpuReport = kernel.profilerEngine.formatReport("cpu");
    expect(cpuReport).toContain("CPU Prime Number Benchmark");
    expect(cpuReport).toContain("PASSED");

    const diskReport = kernel.profilerEngine.formatReport("disk");
    expect(diskReport).toContain("VFS Disk Read/Write Throughput");

    const memReport = kernel.profilerEngine.formatReport("mem");
    expect(memReport).toContain("Memory Bandwidth Allocation");
  });

  it("should execute /bin/sysbench.wasm via sys_execve and stream profiler report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/sysbench.wasm",
      ["/bin/sysbench.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Performance Profiler");
  });
});
