/**
 * @file input.test.ts
 * @module StyxOS/Kernel/InputDeviceEngineTests
 * @description Vitest test suite for Hardware USB/HID Input Subsystem (/dev/input/event0, /dev/input/mice, evtest) and /bin/evtest.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS Hardware USB/HID Input Subsystem Test Suite", () => {
  it("should initialize /dev/input device nodes and list input devices", () => {
    const kernel = new UnixKernel();
    const list = kernel.inputDeviceEngine.listInputs();

    expect(list).toContain("/dev/input/event0");
    expect(list).toContain("/dev/input/mice");
  });

  it("should record and report real-time HID input events via evtest", () => {
    const kernel = new UnixKernel();
    kernel.inputDeviceEngine.emitKeyEvent(30, 1); // KEY_A down
    kernel.inputDeviceEngine.emitMouseEvent(10, 5); // REL_X +10, REL_Y +5

    const report = kernel.inputDeviceEngine.evtest();
    expect(report).toContain("/dev/input/event0");
    expect(report).toContain("/dev/input/mice");
    expect(report).toContain("EV_KEY");
    expect(report).toContain("EV_REL");
  });

  it("should execute /bin/evtest.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/evtest.wasm",
      ["/bin/evtest.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Input Event Inspector");
  });
});
