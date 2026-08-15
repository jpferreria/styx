/**
 * @file tmux.ts
 * @module StyxOS/Kernel/TmuxEngine
 * @description Virtual Terminal Session Multiplexer (tmux / screen, pty.ts session detaching & reattaching).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface TmuxWindow {
  id: number;
  name: string;
  active: boolean;
}

export interface TmuxSession {
  id: number;
  name: string;
  attached: boolean;
  windows: TmuxWindow[];
  created: number;
}

export class TmuxEngine {
  private sessions: Map<string, TmuxSession> = new Map();
  private nextSessionId: number = 0;
  private currentSession: TmuxSession | null = null;

  constructor(_kernel?: UnixKernel) {}

  createSession(name?: string): TmuxSession {
    const id = this.nextSessionId++;
    const sessionName = name || `session-${id}`;
    
    if (this.sessions.has(sessionName)) {
      return this.sessions.get(sessionName)!;
    }

    const session: TmuxSession = {
      id,
      name: sessionName,
      attached: true,
      windows: [
        { id: 0, name: "bash", active: true },
      ],
      created: Date.now(),
    };

    this.sessions.set(sessionName, session);
    this.currentSession = session;
    return session;
  }

  listSessions(): TmuxSession[] {
    return Array.from(this.sessions.values());
  }

  attachSession(nameOrId: string): string {
    const session = this.findSession(nameOrId);
    if (!session) {
      return `tmux: session not found: ${nameOrId}\n`;
    }
    session.attached = true;
    this.currentSession = session;
    return `[attached to tmux session '${session.name}']\n`;
  }

  detachSession(): string {
    if (!this.currentSession) {
      return "tmux: no active session to detach\n";
    }
    const name = this.currentSession.name;
    this.currentSession.attached = false;
    this.currentSession = null;
    return `[detached (from session ${name})]\n`;
  }

  killSession(nameOrId: string): string {
    const session = this.findSession(nameOrId);
    if (!session) {
      return `tmux: session not found: ${nameOrId}\n`;
    }
    if (this.currentSession?.name === session.name) {
      this.currentSession = null;
    }
    this.sessions.delete(session.name);
    return `tmux: killed session '${session.name}'\n`;
  }

  formatTmuxStatus(): string {
    const list = this.listSessions();
    if (list.length === 0) {
      return "no tmux sessions running\n";
    }

    const lines: string[] = ["=== Styx OS Virtual Terminal Multiplexer (tmux) ==="];
    for (const s of list) {
      const state = s.attached ? "(attached)" : "(detached)";
      const current = this.currentSession?.name === s.name ? "*" : " ";
      lines.push(`${current} ${s.name}: ${s.windows.length} windows ${state} [created ${new Date(s.created).toLocaleTimeString()}]`);
    }
    return lines.join("\n") + "\n";
  }

  private findSession(nameOrId: string): TmuxSession | undefined {
    if (this.sessions.has(nameOrId)) {
      return this.sessions.get(nameOrId);
    }
    const id = parseInt(nameOrId, 10);
    if (!isNaN(id)) {
      return Array.from(this.sessions.values()).find((s) => s.id === id);
    }
    return undefined;
  }
}
