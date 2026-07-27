/**
 * @file alias.test.ts
 * @module StyxOS/Kernel/AliasManagerTests
 * @description Vitest test suite for AliasManager command expansion, alias listing, and /bin/alias.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UnixKernel } from "./index";
import { AliasManager } from "../shell/alias";

describe("Styx OS Dynamic Command Alias Test Suite", () => {
  let aliasManager: AliasManager;

  beforeEach(() => {
    aliasManager = new AliasManager();
  });

  it("should expand default command line shortcuts", () => {
    expect(aliasManager.expandAlias("ll")).toBe("ls -l");
    expect(aliasManager.expandAlias("ll /home/user")).toBe("ls -l /home/user");
    expect(aliasManager.expandAlias("la")).toBe("ls -a");
    expect(aliasManager.expandAlias("clr")).toBe("clear");
  });

  it("should define, retrieve, list, and remove dynamic aliases", () => {
    aliasManager.setAlias("gs", "git status");
    expect(aliasManager.getAlias("gs")).toBe("git status");

    expect(aliasManager.expandAlias("gs")).toBe("git status");

    const list = aliasManager.listAliases();
    expect(list).toContain("alias gs='git status'");

    expect(aliasManager.removeAlias("gs")).toBe(true);
    expect(aliasManager.getAlias("gs")).toBeNull();
  });

  it("should execute /bin/alias.wasm via sys_execve and stream alias report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/alias.wasm",
      ["/bin/alias.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Alias");
  });
});
