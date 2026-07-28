/**
 * @file time.test.ts
 * @module StyxOS/Kernel/TimeEngineTests
 * @description Vitest test suite for POSIX Time Subsystem (clock_gettime, nanosleep, timer_create, date, uptime, time) and /bin/time.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { CLOCK_REALTIME, CLOCK_MONOTONIC } from "./time";

describe("Styx OS POSIX Time Subsystem Test Suite", () => {
  it("should query REALTIME and MONOTONIC clocks via clock_gettime", () => {
    const kernel = new UnixKernel();

    const real = kernel.timeEngine.clock_gettime(CLOCK_REALTIME);
    expect(real.tv_sec).toBeGreaterThan(1700000000);

    const mono = kernel.timeEngine.clock_gettime(CLOCK_MONOTONIC);
    expect(mono.tv_sec).toBeGreaterThanOrEqual(0);
  });

  it("should support nanosleep primitives, POSIX timers, date, uptime, and benchmark", async () => {
    const kernel = new UnixKernel();

    const timer = kernel.timeEngine.timer_create(CLOCK_REALTIME);
    expect(timer.timerId).toBe(1);

    const setOk = kernel.timeEngine.timer_settime(timer.timerId, 100);
    expect(setOk).toBe(true);

    const dateText = kernel.timeEngine.formatDate();
    expect(dateText).toContain("GMT");

    const uptimeText = kernel.timeEngine.formatUptime();
    expect(uptimeText).toContain("up");

    await kernel.timeEngine.nanosleep(0, 10000000); // 10ms

    const benchText = await kernel.timeEngine.benchmark(async () => {
      await kernel.timeEngine.nanosleep(0, 5000000);
    });
    expect(benchText).toContain("real");
  });

  it("should execute /bin/time.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/time.wasm",
      ["/bin/time.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Time & Timer Tool");
  });
});
