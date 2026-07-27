/**
 * @file export.test.ts
 * @module StyxOS/Kernel/ExportTests
 * @description Vitest test suite for VFS directory tree archiving, spkg export command, and /bin/spkg-export.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";

describe("Styx OS System Backup & VFS Export Utility Test Suite", () => {
  it("should export /home/user VFS directory tree to tar archive buffer", () => {
    const kernel = new UnixKernel();
    const tarData = kernel.archiveManager.exportDirectory("/home/user", kernel);

    expect(tarData).toBeDefined();
    expect(tarData.length).toBeGreaterThan(512);

    // Extract tar archive entries and verify contents
    const entries = kernel.archiveManager.extractTar(tarData);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.filename.includes("README.txt"))).toBe(true);
  });

  it("should execute spkg export command via package manager", () => {
    const kernel = new UnixKernel();
    const report = kernel.pkgManager.export("/home/user");

    expect(report).toContain("Exported '/home/user'");
    expect(report).toContain("styx-backup-");
  });

  it("should execute /bin/spkg-export.wasm via sys_execve and stream exporter report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/spkg-export.wasm",
      ["/bin/spkg-export.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Backup Exporter");
  });
});
