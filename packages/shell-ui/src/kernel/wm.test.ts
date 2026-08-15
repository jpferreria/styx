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
import { UnixKernel } from "./index";

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

  it("should open text editor window on file double-click", () => {
    const mockKernel = {
      sys_readdir: (_path: string) => [
        { name: "README.txt", stat: { isDir: false } }
      ],
      resolvePath: (_path: string) => ({
        read: () => new TextEncoder().encode("Hello World"),
        write: () => 11
      })
    };

    const fileWin = wm.createFileExplorerWindow(mockKernel);
    const fileItem = fileWin.querySelector("li");
    expect(fileItem).toBeDefined();

    fileItem?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

    const editorWin = document.getElementById("win-editor-_README_txt");
    expect(editorWin).toBeDefined();
    expect(editorWin?.querySelector(".window-title")?.textContent).toContain("Text Editor - /README.txt");
  });

  it("should handle window layout snapping and glassmorphism compositor settings", () => {
    const content = document.createElement("div");
    wm.createWindow({ id: "term", title: "Terminal" }, content);

    const snapRes = wm.snapWindow("term", "tile-left");
    expect(snapRes).toContain("snapped window layout: tile-left");

    const maxRes = wm.snapWindow("term", "maximize");
    expect(maxRes).toContain("snapped window layout: maximize");

    const glassRes = wm.setGlassmorphism(false);
    expect(glassRes).toContain("DISABLED");

    const wallRes = wm.setWallpaper("https://example.com/wallpaper.png");
    expect(wallRes).toContain("wallpaper.png");

    const status = wm.formatWmConfigStatus();
    expect(status).toContain("Glassmorphism Filter:  DISABLED");
  });

  it("should open GUI VFS file finder window element and list VFS files", () => {
    const kernel = new UnixKernel();
    const win = wm.openFileFinderWindow("/home/user", kernel);
    expect(win).toBeDefined();
    expect(win.id).toBe("win-files-app");
    expect(win.querySelector(".window-title")?.textContent).toContain("VFS File Finder");
    expect(win.textContent).toContain("demo.sh");
  });
});
