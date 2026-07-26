/**
 * @file futex.ts
 * @module StyxOS/Kernel/Futex
 * @description SharedArrayBuffer atomic futex synchronization primitives for background process workers.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export enum FutexOp {
  WAIT = 0,
  WAKE = 1,
}

export class FutexSync {
  private buffer: SharedArrayBuffer;
  private int32Array: Int32Array;

  constructor(buffer?: SharedArrayBuffer) {
    // 16 slots (64 bytes) for futex atomic states
    this.buffer = buffer || new SharedArrayBuffer(64);
    this.int32Array = new Int32Array(this.buffer);
  }

  getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }

  wait(idx: number, expectedVal: number, timeoutMs: number = 5000): "ok" | "not-equal" | "timed-out" {
    return Atomics.wait(this.int32Array, idx, expectedVal, timeoutMs);
  }

  wake(idx: number, count: number = 1): number {
    return Atomics.notify(this.int32Array, idx, count);
  }

  setValue(idx: number, val: number): void {
    Atomics.store(this.int32Array, idx, val);
  }

  getValue(idx: number): number {
    return Atomics.load(this.int32Array, idx);
  }
}
