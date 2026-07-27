/**
 * @file mqueue.ts
 * @module StyxOS/Kernel/MessageQueueManager
 * @description POSIX Inter-Process Message Queue subsystem (/dev/mqueue, mq_open, mq_send, mq_receive, ipcs -q).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export interface MessageItem {
  payload: Uint8Array;
  priority: number;
  timestamp: number;
}

export interface MessageQueue {
  msqid: number;
  name: string;
  maxMsg: number;
  msgSize: number;
  messages: MessageItem[];
  owner: string;
}

export class MessageQueueManager {
  private kernel: UnixKernel;
  private queues: Map<string, MessageQueue> = new Map();
  private nextMsqId: number = 2000;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
  }

  mqOpen(name: string, maxMsg: number = 10, msgSize: number = 8192): MessageQueue {
    const normName = name.startsWith("/") ? name : `/${name}`;
    let q = this.queues.get(normName);
    if (!q) {
      q = {
        msqid: this.nextMsqId++,
        name: normName,
        maxMsg,
        msgSize,
        messages: [],
        owner: this.kernel.userManager.getCurrentUser().username,
      };
      this.queues.set(normName, q);
    }
    return q;
  }

  mqSend(name: string, msg: string | Uint8Array, priority: number = 0): boolean {
    const normName = name.startsWith("/") ? name : `/${name}`;
    const q = this.mqOpen(normName);
    if (q.messages.length >= q.maxMsg) return false;

    const payload = typeof msg === "string" ? new TextEncoder().encode(msg) : msg;
    q.messages.push({
      payload,
      priority,
      timestamp: Date.now(),
    });

    // Sort by priority descending, then timestamp ascending
    q.messages.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
    return true;
  }

  mqReceive(name: string): MessageItem | null {
    const normName = name.startsWith("/") ? name : `/${name}`;
    const q = this.queues.get(normName);
    if (!q || q.messages.length === 0) return null;
    return q.messages.shift() || null;
  }

  mqUnlink(name: string): boolean {
    const normName = name.startsWith("/") ? name : `/${name}`;
    return this.queues.delete(normName);
  }

  formatIpcsQueues(): string {
    const lines: string[] = ["------ Message Queues --------"];
    lines.push(`key        msqid      owner      perms      used-bytes  messages  `);

    if (this.queues.size === 0) {
      lines.push(`0x00000000 2000       user       666        0           0         `);
    } else {
      for (const q of this.queues.values()) {
        const keyHex = `0x0000${q.msqid.toString(16)}`;
        const usedBytes = q.messages.reduce((acc, m) => acc + m.payload.length, 0);
        lines.push(`${keyHex.padEnd(10)} ${q.msqid.toString().padEnd(10)} ${q.owner.padEnd(10)} 666        ${usedBytes.toString().padEnd(11)} ${q.messages.length.toString().padEnd(10)}`);
      }
    }
    return lines.join("\n") + "\n";
  }
}
