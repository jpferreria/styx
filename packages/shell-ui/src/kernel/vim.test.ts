/**
 * @file vim.test.ts
 * @module StyxOS/Kernel/VimEditorTests
 * @description Vitest test suite for VimEditor modal text editing, file saving, and /bin/vim.wasm.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { VimEditor, VimMode } from "./vim";

describe("Styx OS Terminal Vim Text Editor Test Suite", () => {
  it("should handle mode transitions between NORMAL, INSERT, and COMMAND modes", () => {
    const kernel = new UnixKernel();
    const editor = new VimEditor(kernel, "/home/user/test.txt");

    expect(editor.getMode()).toBe(VimMode.NORMAL);

    // Switch to INSERT mode
    editor.handleKey("i");
    expect(editor.getMode()).toBe(VimMode.INSERT);

    // Escape back to NORMAL mode
    editor.handleKey("Escape");
    expect(editor.getMode()).toBe(VimMode.NORMAL);

    // Switch to COMMAND mode
    editor.handleKey(":");
    expect(editor.getMode()).toBe(VimMode.COMMAND);
  });

  it("should insert text in INSERT mode and save to VFS via COMMAND mode :w", () => {
    const kernel = new UnixKernel();
    const filePath = "/home/user/vim_test.txt";
    const editor = new VimEditor(kernel, filePath);

    editor.handleKey("i"); // Enter INSERT mode
    editor.handleKey("H");
    editor.handleKey("e");
    editor.handleKey("l");
    editor.handleKey("l");
    editor.handleKey("o");

    expect(editor.getContent()).toContain("Hello");

    editor.handleKey("Escape"); // Exit to NORMAL
    editor.handleKey(":"); // Enter COMMAND mode
    editor.handleKey("w");
    editor.handleKey("Enter"); // Save

    // Verify file content in VFS
    const fd = kernel.sys_open(filePath, false);
    const readBytes = kernel.sys_read(fd, 1024);
    kernel.sys_close(fd);

    const savedText = new TextDecoder().decode(readBytes);
    expect(savedText).toContain("Hello");
  });

  it("should execute /bin/vim.wasm via sys_execve and stream executable report", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/vim.wasm",
      ["/bin/vim.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("VIM");
  });
});
