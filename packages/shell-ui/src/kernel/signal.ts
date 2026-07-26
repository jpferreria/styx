/**
 * @file signal.ts
 * @module StyxOS/Kernel/Signal
 * @description POSIX signal handling dispatcher managing SIGHUP, SIGINT, SIGKILL, SIGTERM, and traps.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export enum Signal {
  SIGHUP = 1,
  SIGINT = 2,
  SIGQUIT = 3,
  SIGKILL = 9,
  SIGUSR1 = 10,
  SIGUSR2 = 12,
  SIGTERM = 15,
}

export type SignalHandler = (signal: Signal) => void;

export class SignalManager {
  private handlers: Map<Signal, SignalHandler[]> = new Map();
  private pendingSignals: Map<number, Signal[]> = new Map();

  registerHandler(signal: Signal, handler: SignalHandler): void {
    const list = this.handlers.get(signal) || [];
    list.push(handler);
    this.handlers.set(signal, list);
  }

  sendSignal(pid: number, signal: Signal): void {
    const list = this.pendingSignals.get(pid) || [];
    list.push(signal);
    this.pendingSignals.set(pid, list);

    // Invoke registered signal handlers
    const registered = this.handlers.get(signal);
    if (registered) {
      registered.forEach((fn) => fn(signal));
    }
  }

  getPendingSignals(pid: number): Signal[] {
    return this.pendingSignals.get(pid) || [];
  }

  clearPendingSignals(pid: number): void {
    this.pendingSignals.delete(pid);
  }
}
