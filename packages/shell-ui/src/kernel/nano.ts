/**
 * @file nano.ts
 * @module StyxOS/Kernel/NanoEditor
 * @description Interactive terminal Nano text editor subsystem supporting live editing, ^O save, and ^X quit.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export class NanoEditor {
  private kernel: UnixKernel;
  private filename: string;
  private lines: string[] = [""];
  private cursorRow: number = 0;
  private cursorCol: number = 0;
  private statusMessage: string = "";

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

  getFilename(): string {
    return this.filename;
  }

  getLines(): string[] {
    return [...this.lines];
  }

  getContent(): string {
    return this.lines.join("\n");
  }

  handleKey(key: string): { output: string; quit: boolean } {
    let quit = false;
    this.statusMessage = "";

    if (key === "\u0018") { // Ctrl+X -> Exit
      quit = true;
    } else if (key === "\u000f") { // Ctrl+O -> Save
      this.save();
      this.statusMessage = `[ Wrote ${this.lines.length} lines to ${this.filename} ]`;
    } else if (key === "\r" || key === "\n" || key === "Enter") {
      const currentLine = this.lines[this.cursorRow];
      const left = currentLine.substring(0, this.cursorCol);
      const right = currentLine.substring(this.cursorCol);
      this.lines[this.cursorRow] = left;
      this.lines.splice(this.cursorRow + 1, 0, right);
      this.cursorRow++;
      this.cursorCol = 0;
    } else if (key === "\b" || key === "\u007f" || key === "Backspace") {
      if (this.cursorCol > 0) {
        const currentLine = this.lines[this.cursorRow];
        this.lines[this.cursorRow] = currentLine.substring(0, this.cursorCol - 1) + currentLine.substring(this.cursorCol);
        this.cursorCol--;
      } else if (this.cursorRow > 0) {
        const prevLen = this.lines[this.cursorRow - 1].length;
        this.lines[this.cursorRow - 1] += this.lines[this.cursorRow];
        this.lines.splice(this.cursorRow, 1);
        this.cursorRow--;
        this.cursorCol = prevLen;
      }
    } else if (key === "\x1b[A" || key === "ArrowUp") {
      this.cursorRow = Math.max(0, this.cursorRow - 1);
      this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol);
    } else if (key === "\x1b[B" || key === "ArrowDown") {
      this.cursorRow = Math.min(this.lines.length - 1, this.cursorRow + 1);
      this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol);
    } else if (key === "\x1b[D" || key === "ArrowLeft") {
      this.cursorCol = Math.max(0, this.cursorCol - 1);
    } else if (key === "\x1b[C" || key === "ArrowRight") {
      this.cursorCol = Math.min(this.lines[this.cursorRow].length, this.cursorCol + 1);
    } else if (key.length === 1 && key >= " ") {
      const currentLine = this.lines[this.cursorRow];
      this.lines[this.cursorRow] = currentLine.substring(0, this.cursorCol) + key + currentLine.substring(this.cursorCol);
      this.cursorCol++;
    }

    return { output: this.render(), quit };
  }

  save(): void {
    const fd = this.kernel.sys_open(this.filename, true);
    this.kernel.sys_write(fd, new TextEncoder().encode(this.getContent()));
    this.kernel.sys_close(fd);
  }

  render(): string {
    const outputLines: string[] = [];
    outputLines.push(`\x1b[1;37;44m  GNU nano 7.2              File: ${this.filename}              \x1b[0m`);

    for (let i = 0; i < this.lines.length; i++) {
      const lineText = this.lines[i];
      if (i === this.cursorRow) {
        outputLines.push(`> ${lineText}`);
      } else {
        outputLines.push(`  ${lineText}`);
      }
    }

    if (this.statusMessage) {
      outputLines.push(`\x1b[1;32m${this.statusMessage}\x1b[0m`);
    } else {
      outputLines.push("");
    }

    outputLines.push(`\x1b[1;30;47m ^G Get Help   ^O WriteOut   ^R Read File  ^Y Prev Page  ^K Cut Text   ^C Cur Pos \x1b[0m`);
    outputLines.push(`\x1b[1;30;47m ^X Exit       ^J Justify    ^W Where Is   ^V Next Page  ^U Uncut Text ^T To Lnum \x1b[0m`);

    return outputLines.join("\n") + "\n";
  }
}
