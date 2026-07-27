/**
 * @file pty.ts
 * @module StyxOS/Kernel/PtyManager
 * @description Pseudoterminal driver subsystem managing master /dev/ptmx and slave /dev/pts/* devices.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface PtySession {
  id: number;
  masterFd: number;
  slavePath: string;
  locked: boolean;
  createdAt: string;
}

export class PtyManager {
  private kernel: UnixKernel;
  private nextPtyId: number = 0;
  private sessions: Map<number, PtySession> = new Map();

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  getKernel(): UnixKernel {
    return this.kernel;
  }

  createPtyPair(): PtySession {
    const id = this.nextPtyId++;
    const slavePath = `/dev/pts/${id}`;
    const masterFd = 100 + id;

    const session: PtySession = {
      id,
      masterFd,
      slavePath,
      locked: true,
      createdAt: new Date().toLocaleTimeString(),
    };

    this.sessions.set(masterFd, session);
    return session;
  }

  grantpt(masterFd: number): boolean {
    const session = this.sessions.get(masterFd);
    return session !== undefined;
  }

  unlockpt(masterFd: number): boolean {
    const session = this.sessions.get(masterFd);
    if (session) {
      session.locked = false;
      return true;
    }
    return false;
  }

  ptsname(masterFd: number): string | null {
    const session = this.sessions.get(masterFd);
    return session ? session.slavePath : null;
  }

  listSessions(): string {
    const lines: string[] = [];
    lines.push("PTY ID   MASTER FD   SLAVE DEVICE   STATUS    CREATED");
    lines.push("-------------------------------------------------------");

    if (this.sessions.size === 0) {
      // Create initial default PTY pair for active terminal
      this.createPtyPair();
    }

    for (const s of this.sessions.values()) {
      const status = s.locked ? "LOCKED" : "UNLOCKED";
      lines.push(`${s.id.toString().padStart(6)}   ${s.masterFd.toString().padStart(9)}   ${s.slavePath.padEnd(12)}   ${status.padEnd(8)}  ${s.createdAt}`);
    }

    return lines.join("\n") + "\n";
  }
}
