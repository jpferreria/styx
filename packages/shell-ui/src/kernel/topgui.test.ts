/**
 * @file topgui.test.ts
 * @module StyxOS/ShellHost/ProcessMonitorGUITests
 * @description Vitest test suite for Process Monitor GUI window creation and /bin/top-gui.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { UnixKernel } from "./index";
import { WindowManager } from "../shell/wm";

describe("Styx OS Real-Time Process Monitor GUI Test Suite", () => {
  let wm: WindowManager;

  beforeEach(() => {
    wm = new WindowManager();
    document.body.innerHTML = '<div id="os-desktop"></div>';
  });

  it("should create process monitor GUI desktop window with procfs report data", () => {
    const report = "PID  USER     PR  NI  VIRT  RES  SHR S  %CPU  %MEM  TIME+  COMMAND\n1    root     20   0  10M   2M   1M  S   0.5   0.1   0:01   init\n";
    const win = wm.createProcessMonitorWindow(report);

    expect(win).toBeDefined();
    expect(win.id).toBe("win-top-gui-monitor");
    expect(win.textContent).toContain("Process Monitor");
    expect(win.textContent).toContain("PID  USER");
  });

  it("should execute /bin/top-gui.wasm via sys_execve and stream report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/top-gui.wasm",
      ["/bin/top-gui.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Process Monitor GUI");
  });
});
