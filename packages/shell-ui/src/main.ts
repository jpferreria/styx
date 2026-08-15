/**
 * @file main.ts
 * @module StyxOS/Main
 * @description Web application initializer wiring DOM controls, WindowManager, and desktop applications.
 *
 * Copyright (C) 2026 Styx OS Project Authors
 * Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
 * See https://www.gnu.org/licenses/gpl-3.0.html for copyleft licensing details.
 */

import { ShellHost } from "./shell";
import { BinaryInstaller } from "./kernel/installer";
import { WindowManager } from "./shell/wm";
import { FramebufferNode } from "./kernel/framebuffer";

document.addEventListener("DOMContentLoaded", () => {
  const terminalRoot = document.getElementById("terminal-root");
  if (!terminalRoot) return;

  const shell = new ShellHost(terminalRoot);
  const kernel = (shell as any).kernel;
  const installer = new BinaryInstaller(kernel);
  const wm = new WindowManager(kernel);

  // Desktop Taskbar Controls
  const tbTerminal = document.getElementById("tb-terminal");
  tbTerminal?.addEventListener("click", () => {
    const termWin = document.getElementById("terminal-window");
    if (termWin) termWin.style.display = termWin.style.display === "none" ? "flex" : "flex";
  });

  const tbDisplay = document.getElementById("tb-display");
  tbDisplay?.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 200;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.imageRendering = "pixelated";
    canvas.style.background = "#000";

    const ctx = canvas.getContext("2d");
    const fbNode = kernel.resolvePath("/dev/fb0") as FramebufferNode;
    if (fbNode && ctx) {
      const render = (w: number, h: number, buf: Uint8Array) => {
        const imgData = ctx.createImageData(w, h);
        imgData.data.set(buf);
        ctx.putImageData(imgData, 0, 0);
      };
      render(fbNode.width, fbNode.height, fbNode.buffer);
      fbNode.onFrameUpdate = render;
    }

    wm.createWindow({ id: "display", title: "/dev/fb0 Graphical Display Screen", width: 480, height: 320 }, canvas);
  });

  const tbFiles = document.getElementById("tb-files");
  tbFiles?.addEventListener("click", () => {
    const fileContainer = document.createElement("div");
    fileContainer.style.color = "#f8fafc";
    fileContainer.style.fontFamily = "Fira Code, monospace";

    const renderDir = (path: string) => {
      const entries = kernel.sys_readdir(path);
      fileContainer.innerHTML = "";

      // Header & Navigation Bar
      const navBar = document.createElement("div");
      navBar.style.display = "flex";
      navBar.style.alignItems = "center";
      navBar.style.gap = "8px";
      navBar.style.marginBottom = "10px";
      navBar.style.paddingBottom = "6px";
      navBar.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

      if (path !== "/") {
        const backBtn = document.createElement("button");
        backBtn.style.padding = "4px 8px";
        backBtn.style.borderRadius = "4px";
        backBtn.style.border = "1px solid rgba(56, 189, 248, 0.4)";
        backBtn.style.background = "rgba(56, 189, 248, 0.15)";
        backBtn.style.color = "#38bdf8";
        backBtn.style.cursor = "pointer";
        backBtn.style.fontSize = "0.75rem";
        backBtn.textContent = "⬅️ Up";

        const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
        backBtn.addEventListener("click", () => renderDir(parentPath));
        navBar.appendChild(backBtn);
      }

      const rootBtn = document.createElement("button");
      rootBtn.style.padding = "4px 8px";
      rootBtn.style.borderRadius = "4px";
      rootBtn.style.border = "1px solid rgba(255, 255, 255, 0.2)";
      rootBtn.style.background = "rgba(255, 255, 255, 0.08)";
      rootBtn.style.color = "#f8fafc";
      rootBtn.style.cursor = "pointer";
      rootBtn.style.fontSize = "0.75rem";
      rootBtn.textContent = "🏠 Root";
      rootBtn.addEventListener("click", () => renderDir("/"));
      navBar.appendChild(rootBtn);

      const pathTitle = document.createElement("span");
      pathTitle.style.color = "#38bdf8";
      pathTitle.style.fontWeight = "600";
      pathTitle.textContent = `Path: ${path}`;
      navBar.appendChild(pathTitle);

      fileContainer.appendChild(navBar);

      const ul = document.createElement("ul");
      ul.style.listStyle = "none";
      ul.style.padding = "0";

      if (path !== "/") {
        const parentLi = document.createElement("li");
        parentLi.style.padding = "4px 0";
        parentLi.style.cursor = "pointer";
        parentLi.style.color = "#94a3b8";
        parentLi.innerHTML = "📁 <strong>..</strong> <em>(Parent Directory)</em>";
        const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
        parentLi.addEventListener("click", () => renderDir(parentPath));
        ul.appendChild(parentLi);
      }

      entries.forEach((e: any) => {
        const li = document.createElement("li");
        li.style.padding = "4px 0";
        li.style.cursor = "pointer";

        const iconSpan = document.createElement("span");
        iconSpan.textContent = e.isDir ? "📁 " : "📄 ";

        const nameSpan = document.createElement("span");
        if (e.isDir) {
          const strong = document.createElement("strong");
          strong.textContent = `${e.name}/`;
          nameSpan.appendChild(strong);
        } else {
          nameSpan.textContent = `${e.name} (${e.size} bytes)`;
        }

        li.appendChild(iconSpan);
        li.appendChild(nameSpan);

        if (e.isDir) {
          li.addEventListener("click", () => renderDir(path === "/" ? `/${e.name}` : `${path}/${e.name}`));
        }
        ul.appendChild(li);
      });
      fileContainer.appendChild(ul);
    };

    renderDir("/");
    wm.createWindow({ id: "files", title: "Styx OS VFS File Explorer", width: 440, height: 300 }, fileContainer);
  });

  // Sidebar Controls
  const btnPosix = document.getElementById("btn-posix");
  btnPosix?.addEventListener("click", () => {
    shell.executeCommand("posix-test");
  });

  const btnMount = document.getElementById("btn-mount");
  btnMount?.addEventListener("click", () => {
    shell.executeCommand("mount-host");
  });

  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const btnInstall = document.getElementById("btn-install");
  btnInstall?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const buffer = await file.arrayBuffer();
    try {
      const installedPath = installer.installBinary(file.name, new Uint8Array(buffer));
      alert(`Styx OS Installer: Installed '${file.name}' to ${installedPath}. Run 'exec ${installedPath}' in terminal.`);
    } catch (err: any) {
      alert(`Styx OS Installer Error: ${err.message}`);
    }
  });

  // Drag and Drop Zone
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    if (!e.dataTransfer || !e.dataTransfer.files.length) return;
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith(".wasm")) {
        const buffer = await file.arrayBuffer();
        try {
          const installedPath = installer.installBinary(file.name, new Uint8Array(buffer));
          alert(`Styx OS Drag-and-Drop: Installed '${file.name}' to ${installedPath}`);
        } catch (err: any) {
          alert(`Styx OS Drag-and-Drop Error: ${err.message}`);
        }
      }
    }
  });

  (window as any).__SHELL__ = shell;
  (window as any).__WM__ = wm;
});
