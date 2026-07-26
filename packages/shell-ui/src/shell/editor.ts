/**
 * @file editor.ts
 * @module StyxOS/ShellHost/TextEditor
 * @description Interactive text editor engine loading, editing, and saving files in Styx OS VFS.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "../kernel";

export class TextEditor {
  private kernel: UnixKernel;
  private currentPath: string = "";
  private content: string = "";

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  loadFile(path: string): string {
    this.currentPath = path;
    try {
      const fd = this.kernel.sys_open(path, false);
      const bytes = this.kernel.sys_read(fd, 65536);
      this.kernel.sys_close(fd);
      this.content = new TextDecoder().decode(bytes);
    } catch {
      // File does not exist yet; initialize empty content
      this.content = "";
    }
    return this.content;
  }

  saveFile(path?: string, newContent?: string): void {
    const targetPath = path || this.currentPath;
    if (!targetPath) {
      throw new Error("Errno 2 (ENOENT): No target file path specified for text editor save operation");
    }

    if (newContent !== undefined) {
      this.content = newContent;
    }

    const bytes = new TextEncoder().encode(this.content);
    const fd = this.kernel.sys_open(targetPath, true);
    this.kernel.sys_write(fd, bytes);
    this.kernel.sys_close(fd);
    this.currentPath = targetPath;
  }

  getContent(): string {
    return this.content;
  }

  setContent(text: string): void {
    this.content = text;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }
}
