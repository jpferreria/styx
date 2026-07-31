/**
 * @file mutex.test.ts
 * @module StyxOS/Kernel/MutexSpinlockEngineTests
 * @description Vitest test suite for Real-Time Multi-Process IPC Shared Mutex & Spinlock Engine (pthread_mutex_init, pthread_mutex_lock, pthread_mutex_unlock, pthread_spin_lock).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Shared Mutex & Spinlock Engine Test Suite", () => {
  it("should initialize and lock/unlock POSIX mutices across process PIDs", () => {
    const kernel = new UnixKernel();
    kernel.mutexSpinlockEngine.pthread_mutex_init("shm_lock1", "normal");

    const locked = kernel.mutexSpinlockEngine.pthread_mutex_lock("shm_lock1", 101);
    expect(locked).toBe(true);

    // Conflict lock attempt by PID 102
    const conflict = kernel.mutexSpinlockEngine.pthread_mutex_lock("shm_lock1", 102);
    expect(conflict).toBe(false);

    const unlocked = kernel.mutexSpinlockEngine.pthread_mutex_unlock("shm_lock1", 101);
    expect(unlocked).toBe(true);
  });

  it("should support recursive mutices for re-entrant locking", () => {
    const kernel = new UnixKernel();
    kernel.mutexSpinlockEngine.pthread_mutex_init("rec_lock", "recursive");

    expect(kernel.mutexSpinlockEngine.pthread_mutex_lock("rec_lock", 201)).toBe(true);
    expect(kernel.mutexSpinlockEngine.pthread_mutex_lock("rec_lock", 201)).toBe(true);

    expect(kernel.mutexSpinlockEngine.pthread_mutex_unlock("rec_lock", 201)).toBe(true);
    const report = kernel.mutexSpinlockEngine.formatMutexStatus();
    expect(report).toContain("rec_lock");
  });

  it("should support kernel spinlocks via pthread_spin_lock", () => {
    const kernel = new UnixKernel();
    const spinOk = kernel.mutexSpinlockEngine.pthread_spin_lock("spin1", 301);
    expect(spinOk).toBe(true);

    const unspinOk = kernel.mutexSpinlockEngine.pthread_spin_unlock("spin1", 301);
    expect(unspinOk).toBe(true);
  });
});
