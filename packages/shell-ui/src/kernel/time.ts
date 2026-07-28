/**
 * @file time.ts
 * @module StyxOS/Kernel/TimeEngine
 * @description POSIX Time Subsystem & High-Resolution Timer Engine (clock_gettime, nanosleep, timer_create, date, uptime, time).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const CLOCK_REALTIME = 0;
export const CLOCK_MONOTONIC = 1;
export const CLOCK_PROCESS_CPUTIME_ID = 2;
export const CLOCK_THREAD_CPUTIME_ID = 3;

export interface Timespec {
  tv_sec: number;
  tv_nsec: number;
}

export interface PosixTimer {
  timerId: number;
  clockId: number;
  intervalMs: number;
  active: boolean;
}

export class TimeEngine {
  private _kernel: UnixKernel;
  private startTimeMs: number;
  private realTimeOffsetMs: number = 0;
  private timers: Map<number, PosixTimer> = new Map();
  private nextTimerId: number = 1;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.startTimeMs = performance.now();
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  clock_gettime(clockId: number = CLOCK_REALTIME): Timespec {
    if (clockId === CLOCK_MONOTONIC || clockId === CLOCK_PROCESS_CPUTIME_ID || clockId === CLOCK_THREAD_CPUTIME_ID) {
      const elapsedMs = performance.now() - this.startTimeMs;
      return {
        tv_sec: Math.floor(elapsedMs / 1000),
        tv_nsec: Math.floor((elapsedMs % 1000) * 1000000),
      };
    }

    // CLOCK_REALTIME
    const nowMs = Date.now() + this.realTimeOffsetMs;
    return {
      tv_sec: Math.floor(nowMs / 1000),
      tv_nsec: Math.floor((nowMs % 1000) * 1000000),
    };
  }

  clock_settime(clockId: number, sec: number, nsec: number = 0): void {
    if (clockId === CLOCK_REALTIME) {
      const targetMs = sec * 1000 + Math.floor(nsec / 1000000);
      this.realTimeOffsetMs = targetMs - Date.now();
    }
  }

  async nanosleep(reqSec: number, reqNsec: number = 0): Promise<void> {
    const totalMs = reqSec * 1000 + reqNsec / 1000000;
    return new Promise((resolve) => setTimeout(resolve, totalMs));
  }

  timer_create(clockId: number = CLOCK_REALTIME): PosixTimer {
    const timer: PosixTimer = {
      timerId: this.nextTimerId++,
      clockId,
      intervalMs: 0,
      active: false,
    };
    this.timers.set(timer.timerId, timer);
    return timer;
  }

  timer_settime(timerId: number, intervalMs: number): boolean {
    const timer = this.timers.get(timerId);
    if (timer) {
      timer.intervalMs = intervalMs;
      timer.active = intervalMs > 0;
      return true;
    }
    return false;
  }

  timer_delete(timerId: number): boolean {
    return this.timers.delete(timerId);
  }

  formatDate(): string {
    const ts = this.clock_gettime(CLOCK_REALTIME);
    const d = new Date(ts.tv_sec * 1000);
    return d.toUTCString() + "\n";
  }

  formatUptime(): string {
    const mono = this.clock_gettime(CLOCK_MONOTONIC);
    const totalSec = mono.tv_sec;
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const timeStr = new Date().toTimeString().split(" ")[0];
    const uptimeStr = `${hours > 0 ? `${hours}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return ` ${timeStr} up ${uptimeStr},  1 user,  load average: 0.05, 0.03, 0.01\n`;
  }

  async benchmark(runFn: () => Promise<void>): Promise<string> {
    const startReal = performance.now();
    await runFn();
    const elapsedMs = performance.now() - startReal;

    const realSec = (elapsedMs / 1000).toFixed(3);
    const userSec = (elapsedMs * 0.85 / 1000).toFixed(3);
    const sysSec = (elapsedMs * 0.15 / 1000).toFixed(3);

    return `\nreal\t0m${realSec}s\nuser\t0m${userSec}s\nsys\t0m${sysSec}s\n`;
  }
}
