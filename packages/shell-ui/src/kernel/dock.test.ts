/**
 * @file dock.test.ts
 * @module StyxOS/ShellHost/DockManagerTests
 * @description Vitest test suite for Desktop Application Launcher Dock widget.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DockManager } from "../shell/dock";

describe("Styx OS Desktop Dock Launcher Test Suite", () => {
  let dockMgr: DockManager;

  beforeEach(() => {
    dockMgr = new DockManager();
    document.body.innerHTML = "";
  });

  it("should return registered desktop applications", () => {
    const apps = dockMgr.getRegisteredApps();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps.some((a) => a.id === "terminal")).toBe(true);
    expect(apps.some((a) => a.id === "files")).toBe(true);
    expect(apps.some((a) => a.id === "top-gui")).toBe(true);
    expect(apps.some((a) => a.id === "theme")).toBe(true);
  });

  it("should create dock DOM element with interactive app icons", () => {
    const onLaunch = vi.fn();
    const dockEl = dockMgr.createDockElement(onLaunch);

    expect(dockEl).toBeDefined();
    expect(dockEl.id).toBe("styx-desktop-dock");
    expect(dockEl.children.length).toBe(7);

    const firstBtn = dockEl.children[0] as HTMLButtonElement;
    firstBtn.click();

    expect(onLaunch).toHaveBeenCalledTimes(1);
    expect(onLaunch).toHaveBeenCalledWith(expect.objectContaining({ id: "terminal" }));
  });
});
