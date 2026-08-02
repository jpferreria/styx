/**
 * @file lockf.test.ts
 * @module StyxOS/Kernel/RecordLockEngineTests
 * @description Vitest test suite for POSIX Advisory Record File Locking Subsystem & Byte-Range Locks (lockf, fcntl F_SETLK, fcntl F_GETLK).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Advisory Record File Locking & Byte-Range Locks Test Suite", () => {
  it("should acquire and release byte-range record locks via fcntl_setlk", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/data.bin";

    // PID 101 acquires write lock on bytes 0..100
    const lockOk = kernel.recordLockEngine.fcntl_setlk(filePath, "F_WRLCK", 0, 100, 101);
    expect(lockOk).toBe(true);

    // PID 102 attempts overlapping write lock on bytes 50..150 -> Conflict!
    const conflict = kernel.recordLockEngine.fcntl_setlk(filePath, "F_WRLCK", 50, 100, 102);
    expect(conflict).toBe(false);

    // PID 101 unlocks byte range 0..100
    const unlockOk = kernel.recordLockEngine.fcntl_setlk(filePath, "F_UNLCK", 0, 100, 101);
    expect(unlockOk).toBe(true);

    // PID 102 acquires lock now that PID 101 released
    const lockAfter = kernel.recordLockEngine.fcntl_setlk(filePath, "F_WRLCK", 50, 100, 102);
    expect(lockAfter).toBe(true);
  });

  it("should inspect lock conflicts via fcntl_getlk", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/data.bin";

    kernel.recordLockEngine.fcntl_setlk(filePath, "F_WRLCK", 0, 50, 201);
    const activeLock = kernel.recordLockEngine.fcntl_getlk(filePath, 10, 20);

    expect(activeLock).not.toBeNull();
    expect(activeLock?.pid).toBe(201);
    expect(activeLock?.type).toBe("F_WRLCK");
  });

  it("should support lockf wrapper commands and format lock status report", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/data.bin";

    const lockfOk = kernel.recordLockEngine.lockf(filePath, "F_LOCK", 0, 200, 301);
    expect(lockfOk).toBe(true);

    const report = kernel.recordLockEngine.formatRecordLocksStatus();
    expect(report).toContain("data.bin");
    expect(report).toContain("301");
    expect(report).toContain("F_WRLCK");
  });
});
