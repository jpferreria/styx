/**
 * @file eventfd.ts
 * @module StyxOS/Kernel/EventNotificationEngine
 * @description POSIX Asynchronous Event Notification Subsystem (eventfd, epoll, select).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const EPOLLIN = 0x001;
export const EPOLLOUT = 0x004;
export const EPOLLERR = 0x008;

export interface EventFDItem {
  fd: number;
  counter: number;
  flags: number;
}

export interface EpollSubscription {
  targetFd: number;
  events: number;
}

export interface EpollInstance {
  epfd: number;
  subscriptions: Map<number, EpollSubscription>;
}

export class EventNotificationEngine {
  private kernel: UnixKernel;
  private eventfds: Map<number, EventFDItem> = new Map();
  private epollInstances: Map<number, EpollInstance> = new Map();
  private nextFd: number = 100;

  constructor(kernel: UnixKernel) {
    this.kernel = kernel;
    // Create default system eventfd
    this.createEventFD(1);
  }

  createEventFD(initval: number = 0, flags: number = 0): number {
    const fd = this.nextFd++;
    this.eventfds.set(fd, { fd, counter: initval, flags });
    return fd;
  }

  writeEventFD(fd: number, value: number): void {
    const item = this.eventfds.get(fd);
    if (!item) throw new Error(`Errno 9: Bad file descriptor eventfd=${fd}`);
    item.counter += value;
  }

  readEventFD(fd: number): number {
    const item = this.eventfds.get(fd);
    if (!item) throw new Error(`Errno 9: Bad file descriptor eventfd=${fd}`);
    const current = item.counter;
    item.counter = 0;
    return current;
  }

  epollCreate(): number {
    const epfd = this.nextFd++;
    this.epollInstances.set(epfd, {
      epfd,
      subscriptions: new Map(),
    });
    return epfd;
  }

  epollCtl(epfd: number, op: "ADD" | "MOD" | "DEL", targetFd: number, events: number = EPOLLIN): void {
    const inst = this.epollInstances.get(epfd);
    if (!inst) throw new Error(`Errno 9: Invalid epoll instance descriptor epfd=${epfd}`);

    if (op === "ADD" || op === "MOD") {
      inst.subscriptions.set(targetFd, { targetFd, events });
    } else if (op === "DEL") {
      inst.subscriptions.delete(targetFd);
    }
  }

  epollWait(epfd: number): number[] {
    const inst = this.epollInstances.get(epfd);
    if (!inst) return [];

    const readyFds: number[] = [];
    for (const [targetFd, sub] of inst.subscriptions.entries()) {
      const efd = this.eventfds.get(targetFd);
      if (efd && efd.counter > 0 && (sub.events & EPOLLIN)) {
        readyFds.push(targetFd);
      }
    }
    return readyFds;
  }

  formatEpollStats(): string {
    const sysActive = !!this.kernel;
    const lines: string[] = [
      "=== Styx OS POSIX Epoll & EventFD Subsystem ===" + (sysActive ? "" : ""),
      `Active EventFD Descriptors: ${this.eventfds.size}`,
      `Active Epoll Instances:    ${this.epollInstances.size}`,
      "",
      "--- EventFD Counter Table ---",
      "FD      COUNTER   FLAGS",
    ];

    for (const item of this.eventfds.values()) {
      lines.push(`${item.fd.toString().padEnd(7)} ${item.counter.toString().padEnd(9)} 0x${item.flags.toString(16)}`);
    }

    lines.push("\n--- Epoll Monitored Descriptors ---");
    lines.push("EPFD    TARGET_FD EVENTS");

    for (const inst of this.epollInstances.values()) {
      for (const sub of inst.subscriptions.values()) {
        lines.push(`${inst.epfd.toString().padEnd(7)} ${sub.targetFd.toString().padEnd(9)} 0x${sub.events.toString(16)}`);
      }
    }

    return lines.join("\n") + "\n";
  }
}
