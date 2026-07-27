/**
 * @file termcolor.ts
 * @module StyxOS/Kernel/TermColorEngine
 * @description ANSI TrueColor (24-bit RGB) & 256-color palette formatting engine (termcolor).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export class TermColorEngine {
  rgb(r: number, g: number, b: number, text: string, bg: boolean = false): string {
    const code = bg ? 48 : 38;
    return `\x1b[${code};2;${r};${g};${b}m${text}\x1b[0m`;
  }

  palette256(index: number, text: string, bg: boolean = false): string {
    const code = bg ? 48 : 38;
    return `\x1b[${code};5;${index}m${text}\x1b[0m`;
  }

  formatColorGrid(): string {
    const lines: string[] = ["\x1b[1m--- Styx OS ANSI 256-Color & TrueColor Diagnostic Grid ---\x1b[0m\n"];

    // Standard 16 colors
    lines.push("\x1b[1mStandard 16 System Colors:\x1b[0m");
    let row1 = "";
    for (let i = 0; i < 16; i++) {
      row1 += this.palette256(i, ` ${i.toString().padStart(3, " ")} `, true);
      if ((i + 1) % 8 === 0) row1 += "\n";
    }
    lines.push(row1);

    // 216 Color Cube Sample
    lines.push("\x1b[1m216 Color Cube Sample:\x1b[0m");
    let cube = "";
    for (let i = 16; i < 52; i++) {
      cube += this.palette256(i, "  ", true);
    }
    lines.push(cube + "\n");

    // TrueColor RGB Spectrum Sample
    lines.push("\x1b[1mTrueColor (24-bit RGB) Spectrum Sample:\x1b[0m");
    let spectrum = "";
    for (let r = 0; r < 256; r += 8) {
      spectrum += this.rgb(r, 128, 255 - r, " ", true);
    }
    lines.push(spectrum + "\n");

    return lines.join("\n");
  }
}
