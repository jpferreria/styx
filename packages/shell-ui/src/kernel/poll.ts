/**
 * @file poll.ts
 * @module StyxOS/Kernel/EventMultiplexEngine
 * @description POSIX Inter-Process Event Polling & Multiplexing Engine (select, poll, epoll_create, epoll_ctl, epoll_wait, lspoll).
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { UnixKernel } from "./index";

export const POLLIN   = 0x0001;
export const POLLOUT  = 0x0004;
export const POLLERR  = 0x0008;
export const POLLHUP  = 0x0010;
export const POLLNVAL = 0x0020;

export interface PollFd {
  fd: number;
  events: number;
  revents: number;
}

export interface EpollEvent {
  events: number;
  fd: number;
}

export class EventMultiplexEngine {
  private _kernel: UnixKernel;
  private epollInstances: Map<number, Map<number, number>> = new Map();
  private nextEpFd: number = 800;

  constructor(kernel: UnixKernel) {
    this._kernel = kernel;
  }

  getKernel(): UnixKernel {
    return this._kernel;
  }

  select(
    readFds: number[] = [],
    writeFds: number[] = [],
    _exceptFds: number[] = [],
    _timeoutMs: number = 0
  ): { read: number[]; write: number[]; except: number[] } {
    const readyRead = readFds.filter((fd) => fd >= 0 && fd < 1024);
    const readyWrite = writeFds.filter((fd) => fd >= 0 && fd < 1024);
    return {
      read: readyRead,
      write: readyWrite,
      except: [],
    };
  }

  poll(fds: PollFd[], _timeoutMs: number = 0): PollFd[] {
    return fds.map((item) => {
      let revents = 0;
      if (item.events & POLLIN) revents |= POLLIN;
      if (item.events & POLLOUT) revents |= POLLOUT;
      return {
        ...item,
        revents,
      };
    });
  }

  epollCreate(_size: number = 1024): number {
    const epfd = this.nextEpFd++;
    this.epollInstances.set(epfd, new Map());
    return epfd;
  }

  epollCtl(epfd: number, op: "ADD" | "MOD" | "DEL", fd: number, events: number = POLLIN): boolean {
    const epMap = this.epollInstances.get(epfd);
    if (!epMap) {
      throw new Error(`Errno 9 (EBADF): Invalid epoll file descriptor ${epfd}`);
    }

    if (op === "ADD" || op === "MOD") {
      epMap.set(fd, events);
    } else if (op === "DEL") {
      epMap.delete(fd);
    }
    return true;
  }

  epollWait(epfd: number, maxEvents: number = 64, _timeoutMs: number = 0): EpollEvent[] {
    const epMap = this.epollInstances.get(epfd);
    if (!epMap) {
      throw new Error(`Errno 9 (EBADF): Invalid epoll file descriptor ${epfd}`);
    }

    const events: EpollEvent[] = [];
    for (const [fd, evMask] of epMap.entries()) {
      if (events.length >= maxEvents) break;
      events.push({ fd, events: evMask });
    }
    return events;
  }

  lspoll(): string {
    const lines: string[] = ["=== Styx OS Active Epoll Multiplexing Descriptors ==="];
    lines.push("EPFD    MONITORED_FD    EVENT_MASK");

    if (this.epollInstances.size === 0) {
      lines.push("(no active epoll instances registered)");
    } else {
      for (const [epfd, epMap] of this.epollInstances.entries()) {
        for (const [fd, evMask] of epMap.entries()) {
          const maskStr = evMask === POLLIN ? "POLLIN" : evMask === POLLOUT ? "POLLOUT" : `0x${evMask.toString(16)}`;
          lines.push(`${epfd.toString().padEnd(7)} ${fd.toString().padEnd(15)} ${maskStr}`);
        }
      }
    }

    return lines.join("\n") + "\n";
  }
}
