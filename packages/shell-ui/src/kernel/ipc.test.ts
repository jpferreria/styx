/**
 * @file ipc.test.ts
 * @module StyxOS/Kernel/IPCCleanupEngineTests
 * @description Vitest test suite for System V & POSIX IPC Management Subsystem (ipcmk, ipcrm, ipcclean, ipcs -a) and /bin/ipcrm.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS System V & POSIX IPC Management Subsystem Test Suite", () => {
  it("should create and remove IPC resources via ipcmk/ipcrm", () => {
    const kernel = new UnixKernel();

    const shmOut = kernel.ipcCleanupEngine.ipcmk("shm", 2048);
    expect(shmOut).toContain("Created shared memory segment");
    const nameMatch = shmOut.match(/name='([^']+)'/);
    const shmName = nameMatch ? nameMatch[1] : "/shm_test";

    const rmOut = kernel.ipcCleanupEngine.ipcrm("shm", shmName);
    expect(rmOut).toContain("Removed shared memory segment");
  });

  it("should clean stale IPC resource handles and format unified ipcs -a report", () => {
    const kernel = new UnixKernel();

    kernel.ipcCleanupEngine.ipcmk("msg", 512);
    kernel.ipcCleanupEngine.ipcmk("sem", 1);

    const cleanOut = kernel.ipcCleanupEngine.ipcclean();
    expect(cleanOut).toContain("IPC Garbage Collector");
    expect(cleanOut).toContain("Cleaned up");

    const ipcsAll = kernel.ipcCleanupEngine.formatIpcsAll();
    expect(ipcsAll).toContain("UNIFIED IPC REPORT");
    expect(ipcsAll).toContain("Shared Memory");
  });

  it("should execute /bin/ipcrm.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/ipcrm.wasm",
      ["/bin/ipcrm.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("IPC Resource Control Tool");
  });
});
