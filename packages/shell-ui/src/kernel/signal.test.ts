/**
 * @file signal.test.ts
 * @module StyxOS/Kernel/SignalTests
 * @description Vitest test suite for POSIX signal registration, sys_kill signals, and /bin/signal.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { Signal } from "./signal";

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

  it("should record pending signals for target process PIDs", () => {
    const kernel = new UnixKernel();

    kernel.sys_kill(100, Signal.SIGTERM);
    const pending = kernel.signalManager.getPendingSignals(100);

    expect(pending).toContain(Signal.SIGTERM);
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
