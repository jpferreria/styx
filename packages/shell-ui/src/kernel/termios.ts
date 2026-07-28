/**
 * @file termios.ts
 * @module StyxOS/Kernel/TermiosEngine
 * @description POSIX Terminal Line Discipline & Termios Subsystem (tcgetattr, tcsetattr, stty).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const IGNBRK = 0o000001;
export const BRKINT = 0o000002;
export const ICRNL  = 0o000400;
export const IXON   = 0o002000;

export const OPOST  = 0o000001;
export const ONLCR  = 0o000004;

export const CS8    = 0o000060;
export const CREAD  = 0o000200;

export const ISIG   = 0o000001;
export const ICANON = 0o000002;
export const ECHO   = 0o000010;
export const ECHOE  = 0o000020;
export const ECHOK  = 0o000040;

export interface Termios {
  iflag: number;
  oflag: number;
  cflag: number;
  lflag: number;
  cc: Record<string, number>;
}

export class TermiosEngine {
  private _kernel: UnixKernel;
  private termiosSettings: Termios;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
    this.termiosSettings = this.createDefaultTermios();
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  private createDefaultTermios(): Termios {
    return {
      iflag: ICRNL | IXON,
      oflag: OPOST | ONLCR,
      cflag: CS8 | CREAD,
      lflag: ISIG | ICANON | ECHO | ECHOE | ECHOK,
      cc: {
        VINTR: 3,  // ^C
        VQUIT: 28, // ^\
        VERASE: 127,// DEL
        VKILL: 21, // ^U
        VEOF: 4,   // ^D
      },
    };
  }

  tcgetattr(): Termios {
    return { ...this.termiosSettings, cc: { ...this.termiosSettings.cc } };
  }

  tcsetattr(settings: Partial<Termios>): void {
    this.termiosSettings = {
      ...this.termiosSettings,
      ...settings,
      cc: { ...this.termiosSettings.cc, ...(settings.cc || {}) },
    };
  }

  setRawMode(): void {
    this.termiosSettings.lflag &= ~(ICANON | ECHO | ISIG);
    this.termiosSettings.oflag &= ~OPOST;
  }

  setSaneMode(): void {
    this.termiosSettings = this.createDefaultTermios();
  }

  stty(args: string[] = []): string {
    if (args.includes("raw")) {
      this.setRawMode();
      return "Terminal line discipline switched to RAW mode\n";
    }

    if (args.includes("sane")) {
      this.setSaneMode();
      return "Terminal line discipline reset to SANE canonical mode\n";
    }

    if (args.includes("-echo")) {
      this.termiosSettings.lflag &= ~ECHO;
      return "Echo disabled (-echo)\n";
    }

    if (args.includes("echo")) {
      this.termiosSettings.lflag |= ECHO;
      return "Echo enabled (echo)\n";
    }

    // Default: stty -a output format
    const t = this.termiosSettings;
    const lines: string[] = [
      "=== Styx OS Terminal Line Discipline (stty -a) ===",
      "speed 38400 baud; rows 24; columns 80; line = 0;",
      `intr = ^C; quit = ^\\; erase = ^?; kill = ^U; eof = ^D;`,
      `iflag: ${t.iflag.toString(8)} (ICRNL IXON)`,
      `oflag: ${t.oflag.toString(8)} (OPOST ONLCR)`,
      `cflag: ${t.cflag.toString(8)} (CS8 CREAD)`,
      `lflag: ${t.lflag.toString(8)} (${(t.lflag & ICANON) ? "ICANON " : ""}${(t.lflag & ECHO) ? "ECHO " : ""}${(t.lflag & ISIG) ? "ISIG " : ""})`,
    ];

    return lines.join("\n") + "\n";
  }
}
