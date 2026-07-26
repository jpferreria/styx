/**
 * @file user.ts
 * @module StyxOS/Kernel/User
 * @description User account authentication, /etc/passwd management, and UID/GID permission switching.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

export interface UserAccount {
  username: string;
  uid: number;
  gid: number;
  gecos: string;
  homeDir: string;
  shell: string;
}

export class UserManager {
  private users: Map<string, UserAccount> = new Map();
  private passwords: Map<string, string> = new Map();
  private currentUsername: string = "user";

  constructor() {
    // Default accounts
    this.addUser({
      username: "root",
      uid: 0,
      gid: 0,
      gecos: "Styx Superuser",
      homeDir: "/root",
      shell: "/bin/sh",
    }, "root");

    this.addUser({
      username: "user",
      uid: 1000,
      gid: 1000,
      gecos: "Styx User",
      homeDir: "/home/user",
      shell: "/bin/sh",
    }, "user");
  }

  addUser(account: UserAccount, passwordHash: string): void {
    this.users.set(account.username, account);
    this.passwords.set(account.username, passwordHash);
  }

  getUser(username: string): UserAccount | undefined {
    return this.users.get(username);
  }

  authenticate(username: string, pass: string): boolean {
    const hash = this.passwords.get(username);
    return hash !== undefined && hash === pass;
  }

  getCurrentUser(): UserAccount {
    return this.users.get(this.currentUsername) || this.users.get("user")!;
  }

  setCurrentUser(username: string): void {
    if (!this.users.has(username)) {
      throw new Error(`Errno 2 (ENOENT): User '${username}' does not exist`);
    }
    this.currentUsername = username;
  }

  generateEtcPasswd(): string {
    const lines: string[] = [];
    for (const acc of this.users.values()) {
      lines.push(`${acc.username}:x:${acc.uid}:${acc.gid}:${acc.gecos}:${acc.homeDir}:${acc.shell}`);
    }
    return lines.join("\n") + "\n";
  }

  generateEtcShadow(): string {
    const lines: string[] = [];
    for (const username of this.users.keys()) {
      lines.push(`${username}:$6$styx$hash:19000:0:99999:7:::`);
    }
    return lines.join("\n") + "\n";
  }
}
