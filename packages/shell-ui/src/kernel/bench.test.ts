/**
 * @file bench.test.ts
 * @module StyxOS/Kernel/BenchmarkTests
 * @description Vitest test suite for BenchmarkEngine system diagnostics and /bin/bench.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { BenchmarkEngine } from "./bench";

describe("Styx OS System Benchmark & Diagnostics Test Suite", () => {
  it("should run system diagnostic benchmark suite and output metrics report", async () => {
    const kernel = new UnixKernel();
    const bench = new BenchmarkEngine(kernel);

    const report = await bench.runBenchmark();

    expect(report).toContain("System Diagnostic Benchmark");
    expect(report).toContain("VFS Throughput");
    expect(report).toContain("Syscall Latency");
    expect(report).toContain("ALL SYSTEM TESTS PASSED SUCCESSFULLY");
  });

  it("should execute /bin/bench.wasm via sys_execve and stream benchmark summary", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/bench.wasm",
      ["/bin/bench.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Benchmark Suite");
  });
});
