/**
 * @file termcolor.test.ts
 * @module StyxOS/Kernel/TermColorEngineTests
 * @description Vitest test suite for ANSI TrueColor & 256-color palette engine and /bin/termcolor.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS ANSI TrueColor Subsystem Test Suite", () => {
  it("should generate 24-bit RGB and 256-color escape sequences", () => {
    const kernel = new UnixKernel();
    const rgbStr = kernel.termColorEngine.rgb(255, 128, 0, "Orange");
    expect(rgbStr).toContain("\x1b[38;2;255;128;0mOrange\x1b[0m");

    const palStr = kernel.termColorEngine.palette256(196, "Red", true);
    expect(palStr).toContain("\x1b[48;5;196mRed\x1b[0m");
  });

  it("should format termcolor diagnostic test grid", () => {
    const kernel = new UnixKernel();
    const grid = kernel.termColorEngine.formatColorGrid();

    expect(grid).toContain("ANSI 256-Color & TrueColor Diagnostic Grid");
    expect(grid).toContain("Standard 16 System Colors");
    expect(grid).toContain("TrueColor (24-bit RGB) Spectrum Sample");
  });

  it("should execute /bin/termcolor.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/termcolor.wasm",
      ["/bin/termcolor.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("ANSI TrueColor Engine");
  });
});
