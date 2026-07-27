/**
 * @file pmap.test.ts
 * @module StyxOS/Kernel/PMapEngineTests
 * @description Vitest test suite for Virtual Memory Map Inspector (/proc/[pid]/maps, pmap) and /bin/pmap.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Virtual Memory Map Inspector Test Suite", () => {
  it("should retrieve process memory mappings for heap, stack, and shared memory", () => {
    const kernel = new UnixKernel();
    const maps = kernel.pmapEngine.getProcessMaps(1);

    expect(maps.length).toBeGreaterThan(0);
    expect(maps.some((m) => m.mapping === "[heap]")).toBe(true);
    expect(maps.some((m) => m.mapping === "[stack]")).toBe(true);
  });

  it("should format pmap report for target PID", () => {
    const kernel = new UnixKernel();
    const report = kernel.pmapEngine.formatPMap(1);

    expect(report).toContain("1:   /bin/init");
    expect(report).toContain("[heap]");
    expect(report).toContain("[stack]");
    expect(report).toContain("total");
  });

  it("should execute /bin/pmap.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/pmap.wasm",
      ["/bin/pmap.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Process Memory Map Inspector");
  });
});
