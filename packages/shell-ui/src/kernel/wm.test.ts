/**
 * @file wm.test.ts
 * @module StyxOS/ShellHost/WindowManagerTests
 * @description Vitest test suite for WindowManager window creation, Z-index, taskbar clock, and notifications.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { WindowManager } from "../shell/wm";

describe("Styx OS Window Manager & Desktop Tray Test Suite", () => {
  let wm: WindowManager;

  beforeEach(() => {
    document.body.innerHTML = '<div id="os-desktop"></div><div id="os-notification-center"></div>';
    wm = new WindowManager();
  });

  it("should create desktop window with title bar controls", () => {
    const content = document.createElement("div");
    content.textContent = "Test Content";

    const win = wm.createWindow({ id: "term", title: "Terminal" }, content);
    expect(win).toBeDefined();
    expect(win.querySelector(".window-title")?.textContent).toBe("Terminal");
  });

  it("should format taskbar tray clock time", () => {
    const timeStr = wm.getFormattedTime();
    expect(timeStr).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it("should dispatch desktop notification toasts", () => {
    const notif = wm.sendNotification("Styx OS System", "Kernel boot complete", "info");

    expect(notif).toBeDefined();
    expect(notif.textContent).toContain("Styx OS System");
    expect(notif.textContent).toContain("Kernel boot complete");
  });

  it("should minimize, restore, and toggle desktop window visibility", () => {
    const content = document.createElement("div");
    const win = wm.createWindow({ id: "files", title: "File Explorer" }, content);

    expect(wm.isMinimized("files")).toBe(false);

    wm.minimizeWindow("files");
    expect(wm.isMinimized("files")).toBe(true);
    expect(win.style.display).toBe("none");

    wm.restoreWindow("files");
    expect(wm.isMinimized("files")).toBe(false);
    expect(win.style.display).toBe("flex");

    wm.toggleWindow("files");
    expect(wm.isMinimized("files")).toBe(true);
  });
});
