/**
 * @file editor.test.ts
 * @module StyxOS/ShellHost/TextEditorTests
 * @description Vitest test suite for Interactive TextEditor engine, buffer management, and /bin/nano.wasm binary.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { describe, it, expect } from "vitest";
import { UnixKernel } from "./index";
import { TextEditor } from "../shell/editor";

describe("Styx OS Text Editor Engine Test Suite", () => {
  it("should create, load, edit, and save text file content in VFS", () => {
    const kernel = new UnixKernel();
    const editor = new TextEditor(kernel);

    const initialContent = editor.loadFile("/home/user/notes.txt");
    expect(initialContent).toBe("");

    editor.setContent("Styx OS Interactive Text Editor Note\nLine 2 content");
    editor.saveFile("/home/user/notes.txt");

    const fd = kernel.sys_open("/home/user/notes.txt", false);
    const savedText = new TextDecoder().decode(kernel.sys_read(fd, 1024));
    kernel.sys_close(fd);

    expect(savedText).toContain("Interactive Text Editor Note");
  });

  it("should execute /bin/nano.wasm via sys_execve and stream startup header", async () => {
    const kernel = new UnixKernel();
    let stdout = "";

    const exitCode = await kernel.sys_execve(
      "/bin/nano.wasm",
      ["/bin/nano.wasm"],
      undefined,
      (text) => { stdout += text; }
    );

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Nano Text Editor");
  });
});
