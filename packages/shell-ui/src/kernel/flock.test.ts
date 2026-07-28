/**
 * @file flock.test.ts
 * @module StyxOS/Kernel/FileLockEngineTests
 * @description Vitest test suite for POSIX File Locking Subsystem (flock, fcntl, /proc/locks, lslocks) and /bin/flock.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX File Locking Subsystem Test Suite", () => {
  it("should acquire and release advisory file locks", () => {
    const kernel = new UnixKernel();

    const acquired = kernel.fileLockEngine.lock(100, "/tmp/lockfile", "WRITE", false);
    expect(acquired).toBe(true);

    const list = kernel.fileLockEngine.listLocks();
    expect(list).toContain("/tmp/lockfile");
    expect(list).toContain("100");

    const released = kernel.fileLockEngine.unlock(100, "/tmp/lockfile");
    expect(released).toBe(true);
  });

  it("should prevent conflicting locks in non-blocking mode", () => {
    const kernel = new UnixKernel();
    kernel.fileLockEngine.lock(101, "/tmp/db.lock", "WRITE", false);

    const conflict = kernel.fileLockEngine.lock(102, "/tmp/db.lock", "WRITE", true);
    expect(conflict).toBe(false);
  });

  it("should update /proc/locks VFS table", () => {
    const kernel = new UnixKernel();
    kernel.fileLockEngine.lock(105, "/tmp/app.lock", "WRITE", false);

    const locksNode = kernel.resolvePath("/proc/locks");
    expect(locksNode).not.toBeNull();

    const buf = locksNode!.read(0, 4096);
    const text = new TextDecoder().decode(buf);
    expect(text).toContain("105");
    expect(text).toContain("ADVISORY");
  });

  it("should execute /bin/flock.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/flock.wasm",
      ["/bin/flock.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("File Locking Tool");
  });
});
