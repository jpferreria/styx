/**
 * @file archive.test.ts
 * @module StyxOS/Kernel/ArchiveTests
 * @description Vitest test suite for ArchiveManager tarball packing/unpacking, tar, and gzip binaries.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { ArchiveManager } from "./archive";

describe("Styx OS File Archive & Compression Test Suite", () => {
  it("should pack entries into tarball stream and unpack correctly", () => {
    const archive = new ArchiveManager();
    const data1 = new TextEncoder().encode("Hello World from File 1\n");
    const data2 = new TextEncoder().encode("Styx OS Tar Archive Data 2\n");

    const tarData = archive.createTar([
      { filename: "file1.txt", size: data1.length, data: data1 },
      { filename: "file2.txt", size: data2.length, data: data2 },
    ]);

    expect(tarData.length).toBeGreaterThan(1024);

    const extracted = archive.extractTar(tarData);
    expect(extracted.length).toBe(2);
    expect(extracted[0].filename).toBe("file1.txt");
    expect(new TextDecoder().decode(extracted[0].data)).toContain("File 1");
    expect(extracted[1].filename).toBe("file2.txt");
  });

  it("should execute /bin/tar.wasm via sys_execve and stream status report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/tar.wasm",
      ["/bin/tar.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Tar v1.34");
  });

  it("should execute /bin/gzip.wasm via sys_execve and stream status report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/gzip.wasm",
      ["/bin/gzip.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Gzip v1.12");
  });

  it("should export VFS directory and trigger browser download string", () => {
    const kernel = new UnixKernel();
    const res = kernel.archiveManager.downloadVfsArchive("/home/user", kernel, "backup.tar");
    expect(res).toContain("exported VFS directory '/home/user'");
  });
});
