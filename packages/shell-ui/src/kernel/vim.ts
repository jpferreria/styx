/**
 * @file vim.ts
 * @module StyxOS/Kernel/VimEditor
 * @description Modal terminal Vim text editor subsystem supporting NORMAL, INSERT, and COMMAND modes.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export enum VimMode {
  NORMAL = "NORMAL",
  INSERT = "INSERT",
  COMMAND = "COMMAND",
}

export class VimEditor {
  private kernel: UnixKernel;
  private filename: string;
  private lines: string[] = [""];
  private cursorRow: number = 0;
  private cursorCol: number = 0;
  private mode: VimMode = VimMode.NORMAL;
  private commandBuffer: string = "";
  private isModified: boolean = false;

  constructor(kernel: UnixKernel, filename: string = "/home/user/newfile.txt") {
    this.kernel = kernel;
    this.filename = filename;
    this.loadFile();
  }

  private loadFile(): void {
    try {
      const fd = this.kernel.sys_open(this.filename, false);
      const data = this.kernel.sys_read(fd, 65536);
      this.kernel.sys_close(fd);
      const text = new TextDecoder().decode(data);
      this.lines = text.split("\n");
      if (this.lines.length === 0) this.lines = [""];
    } catch {
      this.lines = [""];
    }
  }

  getMode(): VimMode {
    return this.mode;
  }

  getFilename(): string {
    return this.filename;
  }

  getLines(): string[] {
    return [...this.lines];
  }

  getCursor(): { row: number; col: number } {
    return { row: this.cursorRow, col: this.cursorCol };
  }

  getContent(): string {
    return this.lines.join("\n");
  }

  handleKey(key: string): { output: string; quit: boolean } {
    let quit = false;

    if (this.mode === VimMode.NORMAL) {
      if (key === "i") {
        this.mode = VimMode.INSERT;
      } else if (key === ":") {
        this.mode = VimMode.COMMAND;
        this.commandBuffer = "";
      } else if (key === "h") {
        this.cursorCol = Math.max(0, this.cursorCol - 1);
      } else if (key === "l") {
        this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol + 1);
      } else if (key === "k") {
        this.cursorRow = Math.max(0, this.cursorRow - 1);
        this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol);
      } else if (key === "j") {
        this.cursorRow = Math.min(this.lines.length - 1, this.cursorRow + 1);
        this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol);
      } else if (key === "dd") {
        if (this.lines.length > 1) {
          this.lines.splice(this.cursorRow, 1);
          this.cursorRow = Math.min(this.cursorRow, this.lines.length - 1);
        } else {
          this.lines = [""];
        }
        this.isModified = true;
      }
    } else if (this.mode === VimMode.INSERT) {
      if (key === "\u001b" || key === "Escape") { // ESC
        this.mode = VimMode.NORMAL;
      } else if (key === "\r" || key === "\n" || key === "Enter") {
        const currentLine = this.lines[this.cursorRow];
        const left = currentLine.substring(0, this.cursorCol);
        const right = currentLine.substring(this.cursorCol);
        this.lines[this.cursorRow] = left;
        this.lines.splice(this.cursorRow + 1, 0, right);
        this.cursorRow++;
        this.cursorCol = 0;
        this.isModified = true;
      } else if (key === "\b" || key === "\u007f" || key === "Backspace") {
        if (this.cursorCol > 0) {
          const currentLine = this.lines[this.cursorRow];
          this.lines[this.cursorRow] = currentLine.substring(0, this.cursorCol - 1) + currentLine.substring(this.cursorCol);
          this.cursorCol--;
          this.isModified = true;
        } else if (this.cursorRow > 0) {
          const prevLen = this.lines[this.cursorRow - 1].length;
          this.lines[this.cursorRow - 1] += this.lines[this.cursorRow];
          this.lines.splice(this.cursorRow, 1);
          this.cursorRow--;
          this.cursorCol = prevLen;
          this.isModified = true;
        }
      } else if (key.length === 1) {
        const currentLine = this.lines[this.cursorRow];
        this.lines[this.cursorRow] = currentLine.substring(0, this.cursorCol) + key + currentLine.substring(this.cursorCol);
        this.cursorCol++;
        this.isModified = true;
      }
    } else if (this.mode === VimMode.COMMAND) {
      if (key === "\u001b" || key === "Escape") {
        this.mode = VimMode.NORMAL;
        this.commandBuffer = "";
      } else if (key === "\r" || key === "\n" || key === "Enter") {
        const cmd = this.commandBuffer.trim();
        if (cmd === "w") {
          this.save();
        } else if (cmd === "q") {
          quit = true;
        } else if (cmd === "wq" || cmd === "x") {
          this.save();
          quit = true;
        } else if (cmd === "q!") {
          quit = true;
        }
        this.mode = VimMode.NORMAL;
        this.commandBuffer = "";
      } else if (key === "\b" || key === "\u007f" || key === "Backspace") {
        this.commandBuffer = this.commandBuffer.substring(0, this.commandBuffer.length - 1);
      } else if (key.length === 1) {
        this.commandBuffer += key;
      }
    }

    return { output: this.render(), quit };
  }

  save(): void {
    const fd = this.kernel.sys_open(this.filename, true);
    this.kernel.sys_write(fd, new TextEncoder().encode(this.getContent()));
    this.kernel.sys_close(fd);
    this.isModified = false;
  }

  render(): string {
    const outputLines: string[] = [];
    outputLines.push(`\x1b[1;34m"VIM Editor" file: ${this.filename}\x1b[0m`);
    outputLines.push("-----------------------------------------------------");

    for (let i = 0; i < this.lines.length; i++) {
      const lineNum = (i + 1).toString().padStart(3, " ");
      const lineText = this.lines[i];
      if (i === this.cursorRow) {
        outputLines.push(`\x1b[1;33m${lineNum} | ${lineText}\x1b[0m`);
      } else {
        outputLines.push(`${lineNum} | ${lineText}`);
      }
    }

    outputLines.push("-----------------------------------------------------");

    if (this.mode === VimMode.INSERT) {
      outputLines.push(`\x1b[1;32m-- INSERT --\x1b[0m [Row ${this.cursorRow + 1}, Col ${this.cursorCol + 1}]`);
    } else if (this.mode === VimMode.COMMAND) {
      outputLines.push(`\x1b[1;36m:${this.commandBuffer}\x1b[0m`);
    } else {
      const status = this.isModified ? "[+]" : "";
      outputLines.push(`\x1b[1;33m-- NORMAL --\x1b[0m ${status} [Row ${this.cursorRow + 1}, Col ${this.cursorCol + 1}]`);
    }

    return outputLines.join("\n") + "\n";
  }
}
