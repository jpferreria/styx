/**
 * @file mmap.test.ts
 * @module StyxOS/Kernel/MMapEngineTests
 * @description Vitest test suite for POSIX Memory Mapping Subsystem (mmap, munmap, msync, /proc/self/maps, lsmaps) and /bin/mmap.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { PROT_READ, PROT_WRITE, MAP_SHARED } from "./mmap";

describe("Styx OS POSIX Memory Mapping Subsystem Test Suite", () => {
  it("should map file into virtual memory space and list mappings", () => {
    const kernel = new UnixKernel();
    const region = kernel.mmapEngine.mmap("/home/user/README.txt", 4096, PROT_READ | PROT_WRITE, MAP_SHARED);

    expect(region.startAddr).toContain("0x7f90");
    expect(region.path).toBe("/home/user/README.txt");

    const list = kernel.mmapEngine.listMaps();
    expect(list).toContain("/home/user/README.txt");
    expect(list).toContain("rw-s");
  });

  it("should generate /proc/self/maps report and support munmap", () => {
    const kernel = new UnixKernel();
    const region = kernel.mmapEngine.mmap("[anon]", 8192);

    const procMaps = kernel.mmapEngine.formatProcSelfMaps();
    expect(procMaps).toContain(region.path);

    const unmapped = kernel.mmapEngine.munmap(region.startAddr);
    expect(unmapped).toBe(true);
  });

  it("should execute /bin/mmap.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/mmap.wasm",
      ["/bin/mmap.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Memory Mapping Tool");
  });
});
