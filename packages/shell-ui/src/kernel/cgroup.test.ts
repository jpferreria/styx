/**
 * @file cgroup.test.ts
 * @module StyxOS/Kernel/CgroupV2EngineTests
 * @description Vitest test suite for POSIX Cgroups v2 Resource Controller Engine (cgcreate, cgexec, cgset, cgget, lscgroup).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Cgroups v2 Resource Controller Engine Test Suite", () => {
  it("should create cgroup v2 controllers via cgcreate", () => {
    const kernel = new UnixKernel();
    const res = kernel.cgroupV2Engine.cgcreate("sandbox1");

    expect(res).toContain("cgcreate");
    expect(res).toContain("sandbox1");
  });

  it("should update memory and CPU controllers via cgset and inspect via cgget", () => {
    const kernel = new UnixKernel();
    kernel.cgroupV2Engine.cgcreate("sandbox1");

    kernel.cgroupV2Engine.cgset("sandbox1", "memory.max", "64M");
    kernel.cgroupV2Engine.cgset("sandbox1", "cpu.max", "50000 100000");

    const report = kernel.cgroupV2Engine.cgget("sandbox1");
    expect(report).toContain("memory.max: 64M");
    expect(report).toContain("cpu.max: 50000 100000");
  });

  it("should attach process PIDs to cgroups via cgexec and list via lscgroup", () => {
    const kernel = new UnixKernel();
    kernel.cgroupV2Engine.cgcreate("sandbox1");
    kernel.cgroupV2Engine.cgexec("sandbox1", 42);

    const list = kernel.cgroupV2Engine.lscgroup();
    expect(list).toContain("/sys/fs/cgroup");
    expect(list).toContain("sandbox1");
  });
});
