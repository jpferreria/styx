/**
 * @file signal.test.ts
 * @module StyxOS/Kernel/SignalTests
 * @description Vitest test suite for POSIX Asynchronous Signal Masks, Real-Time Signals, sigaction, sigprocmask, and /bin/signal.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { Signal, SIG_BLOCK, SIG_UNBLOCK, SA_RESTART } from "./signal";

describe("Styx OS POSIX Signal Dispatcher Test Suite", () => {
  it("should register signal handlers and dispatch SIGINT (2)", () => {
    const kernel = new UnixKernel();
    let handled = false;

    kernel.sys_signal(Signal.SIGINT, (sig) => {
      expect(sig).toBe(Signal.SIGINT);
      handled = true;
    });

    kernel.sys_kill(42, Signal.SIGINT);
    expect(handled).toBe(true);
  });

  it("should manage process signal masks, sigaction, sigprocmask, and real-time signals", () => {
    const kernel = new UnixKernel();

    // Configure sigaction
    const oldAct = kernel.signalManager.sigaction(Signal.SIGUSR1, {
      handler: "SIG_IGN",
      mask: 0,
      flags: SA_RESTART,
    });
    expect(oldAct).toBeDefined();

    // Block SIGUSR1 using sigprocmask
    const sigBit = (1 << (Signal.SIGUSR1 - 1));
    const oldMask = kernel.signalManager.sigprocmask(SIG_BLOCK, sigBit);
    expect(oldMask).toBe(0);

    // Send SIGUSR1 (it should be blocked and pending)
    kernel.signalManager.sendSignal(1, Signal.SIGUSR1);
    const pendingMask = kernel.signalManager.sigpending();
    expect(pendingMask & sigBit).toBeTruthy();

    // Unblock SIGUSR1
    kernel.signalManager.sigprocmask(SIG_UNBLOCK, sigBit);

    // Real-time signal support (SIGRTMIN = 34)
    kernel.signalManager.sendSignal(1, Signal.SIGRTMIN);
    const report = kernel.signalManager.sigcheck();
    expect(report).toContain("Signal Mask");
    expect(report).toContain("SIGINT");
  });

  it("should execute /bin/signal.wasm via sys_execve and output signal report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/signal.wasm",
      ["/bin/signal.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Signal Engine");
  });
});
