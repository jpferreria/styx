/**
 * @file shm.test.ts
 * @module StyxOS/Kernel/SharedMemoryManagerTests
 * @description Vitest test suite for POSIX Shared Memory (/dev/shm, shm_open, ipcs) and /bin/ipcs.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Shared Memory Subsystem Test Suite", () => {
  it("should create, write, read, and unlink shared memory segments", () => {
    const kernel = new UnixKernel();
    const segName = "/styx_shm_buffer";
    const data = new TextEncoder().encode("Shared Memory Payload");

    kernel.shmManager.writeShm(segName, 0, data);

    const retrieved = kernel.shmManager.readShm(segName, 0, data.length);
    expect(retrieved).toBeDefined();
    expect(new TextDecoder().decode(retrieved!)).toBe("Shared Memory Payload");

    const shmid = kernel.shmManager.shm_open(segName);
    expect(shmid).toBeGreaterThan(0);

    expect(kernel.shmManager.shm_unlink(segName)).toBe(true);
    expect(kernel.shmManager.readShm(segName)).toBeNull();
  });

  it("should format ipcs -m shared memory segments report", () => {
    const kernel = new UnixKernel();
    kernel.shmManager.shmOpen("/ipc_segment_1", 2048);
    const report = kernel.shmManager.formatIpcsShm();

    expect(report).toContain("Shared Memory Segments");
    expect(report).toContain("SHMID");
    expect(report).toContain("/ipc_segment_1");
  });

  it("should execute /bin/ipcs.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ipcs.wasm",
      ["/bin/ipcs.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Shared Memory Inspector");
  });
});
