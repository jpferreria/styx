/**
 * @file xattr.test.ts
 * @module StyxOS/Kernel/XAttrManagerTests
 * @description Vitest test suite for POSIX Extended Attributes (getfattr / setfattr) and /bin/getfattr.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS POSIX Extended Attributes Test Suite", () => {
  it("should set, get, list, and remove extended attributes on VFS paths", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/README.txt";

    kernel.xattrManager.setXAttr(filePath, "user.comment", "Styx Backup File");
    kernel.xattrManager.setXAttr(filePath, "user.version", "1.0.0");

    expect(kernel.xattrManager.getXAttr(filePath, "user.comment")).toBe("Styx Backup File");
    expect(kernel.xattrManager.listXAttr(filePath)).toEqual(["user.comment", "user.version"]);

    expect(kernel.xattrManager.removeXAttr(filePath, "user.version")).toBe(true);
    expect(kernel.xattrManager.listXAttr(filePath)).toEqual(["user.comment"]);
  });

  it("should format getfattr dump output", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/README.txt";

    kernel.xattrManager.setXAttr(filePath, "user.comment", "Production Log");
    const dump = kernel.xattrManager.formatGetFAttr(filePath);

    expect(dump).toContain("# file: /home/user/README.txt");
    expect(dump).toContain('user.comment="Production Log"');
  });

  it("should execute /bin/getfattr.wasm and /bin/setfattr.wasm via sys_execve", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCodeGet = await kernel.sys_execve(
      "/bin/getfattr.wasm",
      ["/bin/getfattr.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCodeGet).toBe(0);
    expect(stdout).toContain("Get Extended Attributes");

    let stdoutSet = "";
    const exitCodeSet = await kernel.sys_execve(
      "/bin/setfattr.wasm",
      ["/bin/setfattr.wasm"],
      undefined,
      (text) => { stdoutSet += text; }
    );

    expect(exitCodeSet).toBe(0);
    expect(stdoutSet).toContain("Set Extended Attributes");
  });
});
