/**
 * @file theme.test.ts
 * @module StyxOS/ShellHost/ThemeManagerTests
 * @description Vitest test suite for ThemeManager preset selection, DOM CSS mutation, and /bin/theme.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { UnixKernel } from "./index";
import { ThemeManager } from "../shell/theme";

describe("Styx OS Desktop Theme Engine Test Suite", () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
  });

  it("should switch between dark, cyberpunk, retro, and light desktop themes", () => {
    expect(themeManager.getActiveThemeName()).toBe("dark");

    expect(themeManager.setTheme("cyberpunk")).toBe(true);
    expect(themeManager.getActiveThemeName()).toBe("cyberpunk");

    expect(themeManager.setTheme("retro")).toBe(true);
    expect(themeManager.getActiveThemeName()).toBe("retro");

    expect(themeManager.setTheme("invalid_theme")).toBe(false);
  });

  it("should list available desktop theme presets", () => {
    const list = themeManager.listThemes();
    expect(list).toContain("dark");
    expect(list).toContain("cyberpunk");
    expect(list).toContain("retro");
    expect(list).toContain("light");
  });

  it("should execute /bin/theme.wasm via sys_execve and stream theme switcher report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/theme.wasm",
      ["/bin/theme.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Theme Switcher");
  });
});
