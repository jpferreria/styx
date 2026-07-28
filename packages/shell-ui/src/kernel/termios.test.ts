/**
 * @file termios.test.ts
 * @module StyxOS/Kernel/TermiosEngineTests
 * @description Vitest test suite for POSIX Terminal Line Discipline (tcgetattr, tcsetattr, stty) and /bin/stty.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { ICANON, ECHO } from "./termios";

describe("Styx OS POSIX Termios Line Discipline Test Suite", () => {
  it("should retrieve and modify terminal line discipline attributes via tcgetattr/tcsetattr", () => {
    const kernel = new UnixKernel();
    const initial = kernel.termiosEngine.tcgetattr();

    expect(initial.lflag & ICANON).toBeTruthy();
    expect(initial.lflag & ECHO).toBeTruthy();

    kernel.termiosEngine.setRawMode();
    const rawSettings = kernel.termiosEngine.tcgetattr();
    expect(rawSettings.lflag & ICANON).toBeFalsy();
    expect(rawSettings.lflag & ECHO).toBeFalsy();

    kernel.termiosEngine.setSaneMode();
    const saneSettings = kernel.termiosEngine.tcgetattr();
    expect(saneSettings.lflag & ICANON).toBeTruthy();
  });

  it("should execute stty diagnostic report and mode switching commands", () => {
    const kernel = new UnixKernel();

    const report = kernel.termiosEngine.stty(["-a"]);
    expect(report).toContain("stty -a");
    expect(report).toContain("speed 38400 baud");
    expect(report).toContain("ICANON");

    const rawOut = kernel.termiosEngine.stty(["raw"]);
    expect(rawOut).toContain("RAW mode");

    const saneOut = kernel.termiosEngine.stty(["sane"]);
    expect(saneOut).toContain("SANE canonical mode");
  });

  it("should execute /bin/stty.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/stty.wasm",
      ["/bin/stty.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Termios Control Tool");
  });
});
