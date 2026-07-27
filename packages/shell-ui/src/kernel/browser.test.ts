/**
 * @file browser.test.ts
 * @module StyxOS/ShellHost/BrowserAppTests
 * @description Vitest test suite for Basic Web Browser GUI Application and /bin/browser.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { WindowManager } from "../shell/wm";
import { UnixKernel } from "./index";

describe("Styx OS Basic Web Browser Application Test Suite", () => {
  let wm: WindowManager;

  beforeEach(() => {
    wm = new WindowManager();
    document.body.innerHTML = "";
  });

  it("should create Web Browser window with navigation controls, address bar, and iframe viewport", () => {
    const win = wm.createWebBrowserWindow("https://example.com");

    expect(win).toBeDefined();
    expect(win.querySelector(".browser-navbar")).not.toBeNull();

    const input = win.querySelector("input") as HTMLInputElement;
    const iframe = win.querySelector("iframe") as HTMLIFrameElement;

    expect(input).not.toBeNull();
    expect(input.value).toBe("https://example.com");
    expect(iframe).not.toBeNull();
    expect(iframe.src).toBe("https://example.com/");
  });

  it("should execute /bin/browser.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/browser.wasm",
      ["/bin/browser.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Basic Web Browser");
  });
});
