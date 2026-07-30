/**
 * @file signal.ts
 * @module StyxOS/Kernel/Signal
 * @description POSIX Asynchronous Signal Masks, Real-Time Signals & Handler Dispatcher (sigaction, sigprocmask, sigpending, sigsuspend, sigcheck).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export enum Signal {
  SIGHUP = 1,
  SIGINT = 2,
  SIGQUIT = 3,
  SIGILL = 4,
  SIGTRAP = 5,
  SIGABRT = 6,
  SIGBUS = 7,
  SIGFPE = 8,
  SIGKILL = 9,
  SIGUSR1 = 10,
  SIGSEGV = 11,
  SIGUSR2 = 12,
  SIGPIPE = 13,
  SIGALRM = 14,
  SIGTERM = 15,
  SIGCHLD = 17,
  SIGCONT = 18,
  SIGSTOP = 19,
  SIGTSTP = 20,
  SIGTTIN = 21,
  SIGTTOU = 22,
  SIGURG = 23,
  SIGXCPU = 24,
  SIGXFSZ = 25,
  SIGVTALRM = 26,
  SIGPROF = 27,
  SIGWINCH = 28,
  SIGIO = 29,
  SIGPWR = 30,
  SIGSYS = 31,
  SIGRTMIN = 34,
  SIGRTMAX = 64,
}

export const SIG_BLOCK   = 1;
export const SIG_UNBLOCK = 2;
export const SIG_SETMASK = 3;

export const SA_NOCLDSTOP = 0x00000001;
export const SA_NOCLDWAIT = 0x00000002;
export const SA_SIGINFO   = 0x00000004;
export const SA_RESTART   = 0x10000000;
export const SA_NODEFER   = 0x40000000;

export type SignalHandler = (signal: Signal) => void;

export interface SigAction {
  handler: SignalHandler | string;
  mask: number;
  flags: number;
}

export class SignalManager {
  private handlers: Map<Signal, SignalHandler[]> = new Map();
  private sigActions: Map<number, SigAction> = new Map();
  private pendingSignals: Map<number, Signal[]> = new Map();
  private signalMask: number = 0;
  private pendingMask: number = 0;

  constructor() {
    // Default actions
    this.sigActions.set(Signal.SIGINT, { handler: "SIG_DFL", mask: 0, flags: SA_RESTART });
    this.sigActions.set(Signal.SIGTERM, { handler: "SIG_DFL", mask: 0, flags: SA_RESTART });
  }

  registerHandler(signal: Signal, handler: SignalHandler): void {
    const list = this.handlers.get(signal) || [];
    list.push(handler);
    this.handlers.set(signal, list);
  }

  sendSignal(pid: number, signal: Signal): void {
    const list = this.pendingSignals.get(pid) || [];
    list.push(signal);
    this.pendingSignals.set(pid, list);
    this.pendingMask |= (1 << (signal - 1));

    // Check if blocked by current signal mask
    if (this.signalMask & (1 << (signal - 1))) {
      return; // Signal is blocked and stays pending
    }

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
    this.pendingMask = 0;
  }

  sigaction(sig: number, newAct?: SigAction): SigAction {
    const old = this.sigActions.get(sig) || { handler: "SIG_DFL", mask: 0, flags: 0 };
    if (newAct) {
      this.sigActions.set(sig, { ...newAct });
    }
    return old;
  }

  sigprocmask(how: number, set: number): number {
    const oldMask = this.signalMask;
    if (how === SIG_BLOCK) {
      this.signalMask |= set;
    } else if (how === SIG_UNBLOCK) {
      this.signalMask &= ~set;
    } else if (how === SIG_SETMASK) {
      this.signalMask = set;
    }
    return oldMask;
  }

  sigpending(): number {
    return this.pendingMask & this.signalMask;
  }

  sigsuspend(mask: number): void {
    const prev = this.signalMask;
    this.signalMask = mask;
    // Restore mask on resumption
    this.signalMask = prev;
  }

  sigcheck(): string {
    const lines: string[] = ["=== Styx OS Signal Mask & Real-Time Dispatcher Status ==="];
    lines.push(`Process Signal Mask: 0x${this.signalMask.toString(16).padStart(8, "0")}`);
    lines.push(`Pending Signal Mask: 0x${this.pendingMask.toString(16).padStart(8, "0")}`);
    lines.push("SIGNAL      NAME         HANDLER     FLAGS");

    const getSigName = (s: number) => Signal[s] || `SIGRT_${s}`;

    for (let s = 1; s <= 64; s++) {
      const act = this.sigActions.get(s);
      if (act) {
        const hStr = typeof act.handler === "string" ? act.handler : "custom_fn";
        lines.push(`${s.toString().padEnd(11)} ${getSigName(s).padEnd(12)} ${hStr.padEnd(11)} 0x${act.flags.toString(16)}`);
      }
    }

    return lines.join("\n") + "\n";
  }
}
