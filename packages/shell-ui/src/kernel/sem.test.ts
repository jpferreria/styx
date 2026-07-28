/**
 * @file sem.test.ts
 * @module StyxOS/Kernel/SemaphoreManagerTests
 * @description Vitest test suite for POSIX Semaphore Subsystem (sem_open, sem_wait, sem_post, ipcs -s) and /bin/sem.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Semaphore Subsystem Test Suite", () => {
  it("should perform atomic sem_wait and sem_post lock operations", () => {
    const kernel = new UnixKernel();
    kernel.semaphoreManager.semOpen("/test_sem", 1, 0o666);

    expect(kernel.semaphoreManager.semGetValue("/test_sem")).toBe(1);

    const acquired = kernel.semaphoreManager.semWait("/test_sem");
    expect(acquired).toBe(true);
    expect(kernel.semaphoreManager.semGetValue("/test_sem")).toBe(0);

    const valAfterPost = kernel.semaphoreManager.semPost("/test_sem");
    expect(valAfterPost).toBe(1);
  });

  it("should format active POSIX semaphores for ipcs -s report", () => {
    const kernel = new UnixKernel();
    kernel.semaphoreManager.semOpen("/custom_sem", 3, 0o666);

    const report = kernel.semaphoreManager.formatIpcsSemaphores();
    expect(report).toContain("ipcs -s");
    expect(report).toContain("/custom_sem");
    expect(report).toContain("/mutex_vfs");
  });

  it("should execute /bin/sem.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/sem.wasm",
      ["/bin/sem.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Semaphore Inspector");
  });
});
