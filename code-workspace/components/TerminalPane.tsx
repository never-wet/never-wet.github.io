"use client";

import { useEffect, useRef } from "react";

import type { WorkspaceFile } from "@/lib/types";
import { flattenFiles, flattenTree, normalizeImportPath, simulateRun } from "@/lib/workspace-utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

type PreviewTabOpenResult = "opened" | "blocked" | "missing";

interface PreviewTabEventDetail {
  path?: string | null;
  result?: PreviewTabOpenResult;
}

export function TerminalPane() {
  const containerRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (!containerRef.current || booted.current) return;
    booted.current = true;

    let disposed = false;
    let input = "";
    let history: string[] = [];
    let historyIndex = -1;
    let cwd = "";

    Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(([xtermModule, fitModule]) => {
      if (disposed || !containerRef.current) return;

      const term = new xtermModule.Terminal({
        allowProposedApi: true,
        convertEol: true,
        cursorBlink: true,
        cursorStyle: "bar",
        fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.28,
        theme: {
          background: "#111111",
          foreground: "#d4d4d4",
          cursor: "#4aa3ff",
          black: "#111111",
          blue: "#4aa3ff",
          cyan: "#52d6c5",
          green: "#3fb950",
          magenta: "#d2a8ff",
          red: "#ff7b72",
          white: "#f0f0f0",
          yellow: "#f0c674"
        }
      });
      const fit = new fitModule.FitAddon();

      term.loadAddon(fit);
      term.open(containerRef.current);
      fit.fit();

      const writePrompt = () => {
        const label = cwd ? `~/${cwd}` : "~";
        term.write(`\r\n\x1b[38;5;75mworkspace\x1b[0m:\x1b[38;5;179m${label}\x1b[0m$ `);
      };
      term.writeln("Code Workspace integrated terminal");
      term.writeln("Type help for commands.");
      writePrompt();

      const resize = () => {
        try {
          fit.fit();
        } catch {
          // Fit can fail while the panel is being resized; the next frame will recover.
        }
      };

      const observer = new ResizeObserver(resize);
      observer.observe(containerRef.current);

      const clearInput = () => {
        while (input.length) {
          term.write("\b \b");
          input = input.slice(0, -1);
        }
      };

      const writeInput = (value: string) => {
        clearInput();
        input = value;
        term.write(value);
      };

      const onData = term.onData((data) => {
        const code = data.charCodeAt(0);

        if (data === "\r") {
          const command = input.trim();
          term.write("\r\n");
          if (command) {
            history = [command, ...history.filter((entry) => entry !== command)].slice(0, 30);
            historyIndex = -1;
          }
          cwd = executeCommand(command, term, cwd);
          input = "";
          writePrompt();
          return;
        }

        if (data === "\u007F") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            term.write("\b \b");
          }
          return;
        }

        if (data === "\u001b[A") {
          if (!history.length) return;
          historyIndex = Math.min(historyIndex + 1, history.length - 1);
          writeInput(history[historyIndex]);
          return;
        }

        if (data === "\u001b[B") {
          if (!history.length) return;
          historyIndex = Math.max(historyIndex - 1, -1);
          writeInput(historyIndex === -1 ? "" : history[historyIndex]);
          return;
        }

        if (code >= 32 && code <= 126) {
          input += data;
          term.write(data);
        }
      });

      return () => {
        onData.dispose();
        observer.disconnect();
        term.dispose();
      };
    });

    return () => {
      disposed = true;
    };
  }, []);

  return <div className="xterm-host" ref={containerRef} />;
}

function executeCommand(command: string, term: import("@xterm/xterm").Terminal, cwd: string) {
  const store = useWorkspaceStore.getState();
  const [name, ...args] = parseCommand(command);
  const files = flattenFiles(store.files);
  const active = store.activeFileId ? store.files[store.activeFileId] : undefined;
  const writeLines = (lines: string[]) => {
    lines.forEach((line) => term.writeln(line));
    store.addTerminalLines([`$ ${command}`, ...lines]);
  };

  if (!command) return cwd;

  if (name === "clear") {
    term.clear();
    store.clearTerminal();
    return cwd;
  }

  if (name === "help") {
    writeLines([
      "Code Workspace shell commands:",
      "  navigation: pwd, cd <path>, ls [-la] [path], tree [path]",
      "  files: cat, head, tail, wc, touch, mkdir, rm [-r], mv, cp, open/code",
      "  search: grep <text> [path], find [path] [text]",
      "  write: echo text, echo text > file, echo text >> file",
      "  preview: serve [index.html], localhost [index.html], preview [index.html]",
      "  workspace: run, npm run build, npm test, git status, git add ., git commit -m msg",
      "  ui: theme <dark|light|contrast>, extensions, clear, history, date, whoami"
    ]);
    return cwd;
  }

  if (name === "pwd") {
    writeLines([`/${cwd}`.replace(/\/$/, "") || "/"]);
    return cwd;
  }

  if (name === "ls") {
    const showDetails = args.includes("-l") || args.includes("-la") || args.includes("-al");
    const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
    const targetArg = args.find((arg) => !arg.startsWith("-"));
    const target = resolvePath(cwd, targetArg ?? ".");
    const entries = listDirectory(target, showAll);
    writeLines(entries.length ? entries.map((entry) => (showDetails ? `${entry.type === "folder" ? "drwxr-xr-x" : "-rw-r--r--"} ${entry.name}` : entry.name)) : ["No entries found."]);
    return cwd;
  }

  if (name === "cd") {
    const target = resolvePath(cwd, args[0] ?? "");
    if (!target || isDirectory(target)) return target;
    writeLines([`cd: ${args[0]}: No such directory`]);
    return cwd;
  }

  if (name === "tree") {
    const target = resolvePath(cwd, args[0] ?? ".");
    const treeLines = files
      .filter((file) => !target || file.path === target || file.path.startsWith(`${target}/`))
      .map((file) => `./${file.path}`);
    writeLines(treeLines.length ? treeLines : ["No files found."]);
    return cwd;
  }

  if (name === "cat" || name === "head" || name === "tail") {
    const countFlag = args.find((arg) => /^-\d+$/.test(arg));
    const count = countFlag ? Math.abs(Number(countFlag)) : name === "cat" ? 120 : 20;
    const target = resolvePath(cwd, args.filter((arg) => !/^-\d+$/.test(arg)).join(" "));
    const file = findFile(target);
    if (!file) {
      writeLines([`${name}: ${target}: No such file`]);
      return cwd;
    }
    const lines = file.content.split("\n");
    writeLines(name === "tail" ? lines.slice(-count) : lines.slice(0, count));
    return cwd;
  }

  if (name === "wc") {
    const target = resolvePath(cwd, args[0] ?? "");
    const file = findFile(target);
    if (!file) {
      writeLines([`wc: ${target}: No such file`]);
      return cwd;
    }
    const lineCount = file.content.split("\n").length;
    const wordCount = file.content.trim() ? file.content.trim().split(/\s+/).length : 0;
    writeLines([`${lineCount} ${wordCount} ${file.content.length} ${file.path}`]);
    return cwd;
  }

  if (name === "open" || name === "code") {
    const target = resolvePath(cwd, args.join(" "));
    const opened = store.openFileByPath(target);
    writeLines([opened ? `Opened ${target}` : `open: ${target}: No such file`]);
    return cwd;
  }

  if (name === "serve" || name === "localhost" || name === "preview") {
    const requestedPath = args.length ? resolvePath(cwd, args.join(" ")) : "";
    const htmlFile = findHtmlEntry(requestedPath);

    if (!htmlFile) {
      writeLines([
        requestedPath ? `localhost: ${requestedPath}: no HTML file found` : "localhost: no index.html or HTML file found in this workspace",
        "Usage: serve [path/to/index.html]"
      ]);
      return cwd;
    }

    store.setPreviewPath(htmlFile.path);
    store.setBottomPanelView("preview");
    const result = requestPreviewTab(htmlFile.path);
    writeLines([
      `Serving ${htmlFile.path}`,
      "Local URL: http://localhost:5173/",
      getPreviewOpenMessage(result)
    ]);
    return cwd;
  }

  if (name === "touch") {
    args.forEach((arg) => store.createFile(resolvePath(cwd, arg), findFile(resolvePath(cwd, arg))?.content ?? ""));
    writeLines(args.length ? args.map((arg) => `touched ${resolvePath(cwd, arg)}`) : ["touch: missing file operand"]);
    return cwd;
  }

  if (name === "mkdir") {
    const folders = args.filter((arg) => arg !== "-p");
    folders.forEach((arg) => store.createFolder(resolvePath(cwd, arg)));
    writeLines(folders.length ? folders.map((arg) => `created ${resolvePath(cwd, arg)}/`) : ["mkdir: missing operand"]);
    return cwd;
  }

  if (name === "rm") {
    const targets = args.filter((arg) => !arg.startsWith("-"));
    const messages = targets.map((arg) => {
      const target = resolvePath(cwd, arg);
      return store.deletePath(target) ? `removed ${target}` : `rm: ${target}: No such file or directory`;
    });
    writeLines(messages.length ? messages : ["rm: missing operand"]);
    return cwd;
  }

  if (name === "mv" || name === "cp") {
    if (args.length < 2) {
      writeLines([`${name}: missing file operand`]);
      return cwd;
    }
    const from = resolvePath(cwd, args[0]);
    const to = resolvePath(cwd, args[1]);
    const ok = name === "mv" ? store.movePath(from, to) : store.copyPath(from, to);
    writeLines([ok ? `${name === "mv" ? "moved" : "copied"} ${from} -> ${to}` : `${name}: ${from}: No such file or directory`]);
    return cwd;
  }

  if (name === "echo") {
    const redirectIndex = args.findIndex((arg) => arg === ">" || arg === ">>");
    if (redirectIndex >= 0) {
      const text = args.slice(0, redirectIndex).join(" ");
      const target = resolvePath(cwd, args[redirectIndex + 1] ?? "");
      const append = args[redirectIndex] === ">>";
      const previous = append ? findFile(target)?.content ?? "" : "";
      store.createFile(target, append && previous ? `${previous}\n${text}` : text);
      writeLines([`${append ? "appended to" : "wrote"} ${target}`]);
      return cwd;
    }
    writeLines([args.join(" ")]);
    return cwd;
  }

  if (name === "grep") {
    const pattern = args[0];
    const target = resolvePath(cwd, args[1] ?? ".");
    if (!pattern) {
      writeLines(["grep: missing search pattern"]);
      return cwd;
    }
    const matches = files
      .filter((file) => file.path === target || file.path.startsWith(`${target}/`) || (!args[1] && file.path.startsWith(cwd)))
      .flatMap((file) =>
        file.content
          .split("\n")
          .map((line, index) => ({ file, line, index }))
          .filter(({ line }) => line.toLowerCase().includes(pattern.toLowerCase()))
          .map(({ file, line, index }) => `${file.path}:${index + 1}: ${line}`)
      )
      .slice(0, 80);
    writeLines(matches.length ? matches : [`No matches for "${pattern}".`]);
    return cwd;
  }

  if (name === "find") {
    const target = resolvePath(cwd, args[0] && !args[0].startsWith("-") ? args[0] : ".");
    const pattern = args.at(-1)?.startsWith("-") ? "" : args.at(-1) ?? "";
    const results = files
      .filter((file) => !target || file.path === target || file.path.startsWith(`${target}/`))
      .filter((file) => !pattern || file.path.toLowerCase().includes(pattern.toLowerCase()))
      .map((file) => file.path)
      .slice(0, 120);
    writeLines(results.length ? results : ["No files found."]);
    return cwd;
  }

  if (name === "run") {
    if (active && isHtmlFile(active)) {
      store.setPreviewPath(active.path);
      store.setBottomPanelView("preview");
      const result = requestPreviewTab(active.path);
      writeLines([`Serving ${active.path}`, "Local URL: http://localhost:5173/", getPreviewOpenMessage(result)]);
      return cwd;
    }

    writeLines(simulateRun(active));
    return cwd;
  }

  if (name === "npm" && (args[0] === "test" || (args[0] === "run" && args[1] === "test"))) {
    const test = files.find((file) => file.path.endsWith(".test.ts"));
    writeLines(simulateRun(test));
    return cwd;
  }

  if (name === "npm" && args[0] === "run" && args[1] === "build") {
    writeLines(simulateRun(files.find((file) => file.path.endsWith("package.json")) ?? active));
    return cwd;
  }

  if (name === "npm" && args[0] === "run" && args[1] === "dev") {
    const htmlFile = findHtmlEntry("");
    if (htmlFile) {
      store.setPreviewPath(htmlFile.path);
      store.setBottomPanelView("preview");
    }
    const result = htmlFile ? requestPreviewTab(htmlFile.path) : "missing";
    writeLines([
      "> vite --host 127.0.0.1",
      "Virtual dev server started for the browser workspace.",
      htmlFile ? `Preview target: http://localhost:5173/ (${htmlFile.path})` : "Preview target: no HTML entry found.",
      getPreviewOpenMessage(result)
    ]);
    return cwd;
  }

  if (name === "git" && args[0] === "status") {
    const changed = files.filter((file) => file.modified);
    writeLines(changed.length ? changed.map((file) => `modified: ${file.path}`) : ["On branch main", "nothing to commit, working tree clean"]);
    return cwd;
  }

  if (name === "git" && args[0] === "add") {
    store.saveAllFiles();
    writeLines(["Staged all virtual workspace changes."]);
    return cwd;
  }

  if (name === "git" && args[0] === "commit") {
    const messageIndex = args.findIndex((arg) => arg === "-m");
    const message = messageIndex >= 0 ? args[messageIndex + 1] : "workspace commit";
    writeLines([`[main virtual] ${message}`, `${files.length} file(s) in workspace snapshot.`]);
    return cwd;
  }

  if (name === "git" && args[0] === "log") {
    writeLines(["commit virtual-head", "Author: Code Workspace", "    Latest in-browser workspace snapshot"]);
    return cwd;
  }

  if (name === "theme") {
    const nextTheme = args[0];
    if (nextTheme === "dark" || nextTheme === "light" || nextTheme === "contrast") {
      store.setTheme(nextTheme);
      writeLines([`Theme switched to ${nextTheme}.`]);
    } else {
      writeLines(["Usage: theme <dark|light|contrast>"]);
    }
    return cwd;
  }

  if (name === "extensions") {
    writeLines(store.enabledExtensionIds.map((id) => `enabled: ${id}`));
    return cwd;
  }

  if (name === "history") {
    writeLines(["History is available with Up/Down arrows during this terminal session."]);
    return cwd;
  }

  if (name === "date") {
    writeLines([new Date().toString()]);
    return cwd;
  }

  if (name === "whoami") {
    writeLines(["browser-user"]);
    return cwd;
  }

  writeLines([`${name}: command not found`]);
  return cwd;

  function findFile(path: string) {
    return flattenFiles(useWorkspaceStore.getState().files).find((file) => file.path === normalizeImportPath(path));
  }

  function findHtmlEntry(path: string) {
    const currentFiles = flattenFiles(useWorkspaceStore.getState().files);
    const normalizedPath = normalizeImportPath(path);

    if (normalizedPath) {
      const exact = currentFiles.find((file) => file.path === normalizedPath && isHtmlFile(file));
      if (exact) return exact;

      const nestedIndex = currentFiles.find((file) => file.path.startsWith(`${normalizedPath}/`) && file.name.toLowerCase() === "index.html");
      if (nestedIndex) return nestedIndex;

      const nestedHtml = currentFiles.find((file) => file.path.startsWith(`${normalizedPath}/`) && isHtmlFile(file));
      if (nestedHtml) return nestedHtml;
    }

    const scopedFiles = cwd ? currentFiles.filter((file) => file.path.startsWith(`${cwd}/`)) : currentFiles;
    return (
      scopedFiles.find((file) => file.name.toLowerCase() === "index.html") ??
      scopedFiles.find(isHtmlFile) ??
      currentFiles.find((file) => file.name.toLowerCase() === "index.html") ??
      currentFiles.find(isHtmlFile)
    );
  }

  function isDirectory(path: string) {
    if (!path) return true;
    const normalizedPath = normalizeImportPath(path);
    const current = useWorkspaceStore.getState();
    return (
      flattenTree(current.fileTree).some((node) => node.type === "folder" && node.path === normalizedPath) ||
      Object.values(current.files).some((file) => file.path.startsWith(`${normalizedPath}/`))
    );
  }

  function listDirectory(path: string, showAll: boolean) {
    const current = useWorkspaceStore.getState();
    const normalizedPath = normalizeImportPath(path);
    const prefix = normalizedPath ? `${normalizedPath}/` : "";
    const entries = new Map<string, { name: string; type: "file" | "folder" }>();

    flattenTree(current.fileTree).forEach((node) => {
      if (node.path === normalizedPath) return;
      if (prefix && !node.path.startsWith(prefix)) return;
      if (!prefix && node.path.includes("/")) {
        const [first] = node.path.split("/");
        entries.set(first, { name: `${first}/`, type: "folder" });
        return;
      }
      const relative = prefix ? node.path.slice(prefix.length) : node.path;
      const [first, ...rest] = relative.split("/");
      if (!first || (!showAll && first.startsWith("."))) return;
      entries.set(first, { name: rest.length || node.type === "folder" ? `${first}/` : first, type: rest.length ? "folder" : node.type });
    });

    return [...entries.values()].sort((left, right) => left.name.localeCompare(right.name));
  }
}

function isHtmlFile(file: WorkspaceFile) {
  return file.language === "html" || /\.html?$/i.test(file.path);
}

function requestPreviewTab(path: string): PreviewTabOpenResult {
  if (typeof window === "undefined") return "blocked";

  const detail: PreviewTabEventDetail = { path, result: "blocked" };
  window.dispatchEvent(new CustomEvent<PreviewTabEventDetail>("code-workspace:open-preview-tab", { detail }));
  return detail.result ?? "blocked";
}

function getPreviewOpenMessage(result: PreviewTabOpenResult) {
  if (result === "opened") return "Preview opened in a new browser tab.";
  if (result === "blocked") return "Popup blocked. Use the PREVIEW panel's Open Tab button.";
  return "No HTML entry found for preview.";
}

function parseCommand(command: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: string | null = null;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    const next = command[index + 1];

    if (character === "\\" && next) {
      current += next;
      index += 1;
      continue;
    }

    if ((character === `"` || character === "'") && (!quote || quote === character)) {
      quote = quote ? null : character;
      continue;
    }

    if (/\s/.test(character) && !quote) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }

    if ((character === ">" || character === "<") && !quote) {
      if (current) tokens.push(current);
      if (character === ">" && next === ">") {
        tokens.push(">>");
        index += 1;
      } else {
        tokens.push(character);
      }
      current = "";
      continue;
    }

    current += character;
  }

  if (current) tokens.push(current);
  return tokens;
}

function resolvePath(cwd: string, rawPath: string) {
  const input = rawPath.trim();
  if (!input || input === "." || input === "~") return normalizeImportPath(cwd);

  const absolute = input.startsWith("/") ? input.slice(1) : input.startsWith("~/") ? input.slice(2) : cwd ? `${cwd}/${input}` : input;
  const parts: string[] = [];

  normalizeImportPath(absolute)
    .split("/")
    .filter(Boolean)
    .forEach((part) => {
      if (part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });

  return parts.join("/");
}
