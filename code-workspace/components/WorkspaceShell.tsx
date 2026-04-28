"use client";

import dynamic from "next/dynamic";
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Code,
  Command,
  Database,
  FileCode,
  FileAudio,
  FileImage,
  FileJson,
  FileText,
  FileVideo,
  Files,
  Folder,
  FolderOpen,
  GitBranch,
  ExternalLink,
  Keyboard,
  Palette,
  Play,
  Puzzle,
  Settings2,
  Save,
  Search,
  Settings,
  Terminal,
  RefreshCw,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

import { builtinExtensions } from "@/extensions/builtin";
import { activateExtensions } from "@/extensions/extensionHost";
import { cacheAssetBlob, getCachedAssetBlob } from "@/lib/blob-cache";
import type { ActivityView, FileNode, ImportedWorkspaceFile, WorkspaceCommand, WorkspaceFile } from "@/lib/types";
import { flattenFiles, fuzzyScore, getLanguageLabel, normalizeImportPath, simulateRun } from "@/lib/workspace-utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

import { CommandPalette } from "./CommandPalette";

const EditorPane = dynamic(() => import("./EditorPane").then((mod) => mod.EditorPane), {
  ssr: false,
  loading: () => <div className="editor-loading">Loading Monaco editor...</div>
});

const TerminalPane = dynamic(() => import("./TerminalPane").then((mod) => mod.TerminalPane), {
  ssr: false,
  loading: () => <div className="terminal-fallback">Starting terminal...</div>
});

type PreviewTabOpenResult = "opened" | "blocked" | "missing";

interface PreviewTabEventDetail {
  path?: string | null;
  result?: PreviewTabOpenResult;
}

const activityItems: Array<{ id: ActivityView; label: string; icon: LucideIcon }> = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: Search },
  { id: "source", label: "Source Control", icon: GitBranch },
  { id: "run", label: "Run and Debug", icon: Bug },
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "settings", label: "Settings", icon: Settings }
];

const treeRenderBatchSize = 260;
const importYieldBatchSize = 40;
const maxImportedBrowserFiles = 5000;
const maxImportedDirectoryFiles = 5000;
const maxEditableTextFileSize = 2 * 1024 * 1024;

export function WorkspaceShell() {
  const theme = useWorkspaceStore((state) => state.theme);
  const enabledExtensionIds = useWorkspaceStore((state) => state.enabledExtensionIds);

  const extensionHost = useMemo(() => {
    const enabled = builtinExtensions.filter((extension) => enabledExtensionIds.includes(extension.id));
    return activateExtensions(enabled);
  }, [enabledExtensionIds]);

  const commands = useMemo(
    () => [...createCoreCommands(), ...extensionHost.commands].sort((left, right) => left.title.localeCompare(right.title)),
    [extensionHost.commands]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useWorkspaceStore.getState();
      const cmdOrCtrl = event.metaKey || event.ctrlKey;

      if (cmdOrCtrl && event.key.toLowerCase() === "p") {
        event.preventDefault();
        store.openCommandPalette("");
        return;
      }

      if (cmdOrCtrl && event.key.toLowerCase() === "s") {
        event.preventDefault();
        store.saveActiveFile();
        return;
      }

      if (cmdOrCtrl && event.key.toLowerCase() === "o") {
        event.preventDefault();
        dispatchImportRequest("open-file");
        return;
      }

      if (cmdOrCtrl && event.key === "Enter") {
        event.preventDefault();
        runActiveFileFromMenu();
        return;
      }

      if (cmdOrCtrl && event.key === "`") {
        event.preventDefault();
        store.toggleBottomPanel();
      }
    };

    const onOpenPreviewTab = (event: Event) => {
      const previewEvent = event as CustomEvent<PreviewTabEventDetail>;
      const detail = previewEvent.detail ?? {};
      detail.result = openPreviewTabForPath(detail.path);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("code-workspace:open-preview-tab", onOpenPreviewTab);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("code-workspace:open-preview-tab", onOpenPreviewTab);
    };
  }, []);

  return (
    <div className="workspace-shell" data-theme={theme}>
      <ActivityBar />
      <Sidebar extensionPanels={extensionHost.panels} />
      <main className="editor-workbench">
        <TopBar />
        <EditorTabs />
        <EditorArea snippets={extensionHost.snippets} />
        <BottomPanel />
        <StatusBar statusItems={extensionHost.statusItems} />
      </main>
      <FileImportControls />
      <CommandPalette commands={commands} />
    </div>
  );
}

function createCoreCommands(): WorkspaceCommand[] {
  return [
    {
      id: "workbench.action.openFile",
      title: "File: Open File...",
      category: "File",
      keybinding: "Ctrl+O",
      keywords: ["import", "local", "picker"],
      run: () => dispatchImportRequest("open-file")
    },
    {
      id: "workbench.action.openFolder",
      title: "File: Open Folder...",
      category: "File",
      keywords: ["import", "folder", "project"],
      run: () => dispatchImportRequest("open-folder")
    },
    {
      id: "workbench.action.files",
      title: "View: Show Explorer",
      category: "View",
      keybinding: "Ctrl+Shift+E",
      run: () => useWorkspaceStore.getState().setActivityView("explorer")
    },
    {
      id: "workbench.action.search",
      title: "View: Show Search",
      category: "View",
      keybinding: "Ctrl+Shift+F",
      run: () => useWorkspaceStore.getState().setActivityView("search")
    },
    {
      id: "workbench.action.terminal",
      title: "Terminal: Toggle Integrated Terminal",
      category: "Terminal",
      keybinding: "Ctrl+`",
      run: () => useWorkspaceStore.getState().toggleBottomPanel()
    },
    {
      id: "workbench.action.previewLocalhost",
      title: "Preview: Serve HTML on Localhost",
      category: "Preview",
      keywords: ["localhost", "serve", "index", "html", "browser"],
      run: serveHtmlPreviewFromMenu
    },
    {
      id: "workbench.action.save",
      title: "File: Save",
      category: "File",
      keybinding: "Ctrl+S",
      run: () => useWorkspaceStore.getState().saveActiveFile()
    },
    {
      id: "editor.action.find",
      title: "Editor: Find",
      category: "Editor",
      keybinding: "Ctrl+F",
      run: () => useWorkspaceStore.getState().queueEditorAction("actions.find")
    },
    {
      id: "editor.action.replace",
      title: "Editor: Find and Replace",
      category: "Editor",
      keybinding: "Ctrl+H",
      run: () => useWorkspaceStore.getState().queueEditorAction("editor.action.startFindReplaceAction")
    },
    {
      id: "editor.action.gotoLine",
      title: "Editor: Go to Line",
      category: "Editor",
      keybinding: "Ctrl+G",
      run: () => useWorkspaceStore.getState().queueEditorAction("editor.action.gotoLine")
    },
    {
      id: "workbench.action.toggleSplit",
      title: "View: Toggle Split Editor",
      category: "View",
      run: () => useWorkspaceStore.getState().toggleSplitView()
    },
    {
      id: "workbench.action.toggleMinimap",
      title: "Editor: Toggle Minimap",
      category: "Editor",
      run: () => useWorkspaceStore.getState().toggleMinimap()
    },
    {
      id: "workbench.action.resetWorkspace",
      title: "Developer: Reset Demo Workspace",
      category: "Developer",
      run: () => useWorkspaceStore.getState().resetWorkspace()
    }
  ];
}

function ActivityBar() {
  const activityView = useWorkspaceStore((state) => state.activityView);
  const setActivityView = useWorkspaceStore((state) => state.setActivityView);

  return (
    <nav className="activity-bar" aria-label="Activity bar">
      <div className="activity-logo">CW</div>
      {activityItems.map(({ id, label, icon: Icon }) => (
        <button
          aria-label={label}
          className={activityView === id ? "active" : ""}
          key={id}
          onClick={() => setActivityView(id)}
          title={label}
          type="button"
        >
          <Icon size={21} strokeWidth={1.8} />
        </button>
      ))}
    </nav>
  );
}

function Sidebar({ extensionPanels }: { extensionPanels: ReturnType<typeof activateExtensions>["panels"] }) {
  const activityView = useWorkspaceStore((state) => state.activityView);
  const sidebarWidth = useWorkspaceStore((state) => state.sidebarWidth);
  const setSidebarWidth = useWorkspaceStore((state) => state.setSidebarWidth);

  function beginResize(event: React.PointerEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const move = (moveEvent: PointerEvent) => setSidebarWidth(startWidth + moveEvent.clientX - startX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <aside className="sidebar" style={{ width: sidebarWidth }}>
      <div className="sidebar-title">{getActivityTitle(activityView)}</div>
      {activityView === "explorer" && <ExplorerView />}
      {activityView === "search" && <SearchView />}
      {activityView === "source" && <SourceControlView />}
      {activityView === "run" && <RunView />}
      {activityView === "extensions" && <ExtensionsView extensionPanels={extensionPanels} />}
      {activityView === "settings" && <SettingsView />}
      <div aria-hidden="true" className="sidebar-resize" onPointerDown={beginResize} />
    </aside>
  );
}

function getActivityTitle(view: ActivityView) {
  const titles: Record<ActivityView, string> = {
    explorer: "Explorer",
    search: "Search",
    source: "Source Control",
    run: "Run and Debug",
    extensions: "Extensions",
    settings: "Settings"
  };
  return titles[view];
}

function ExplorerView() {
  const fileTree = useWorkspaceStore((state) => state.fileTree);
  const expandedFolders = useWorkspaceStore((state) => state.expandedFolders);
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const toggleFolder = useWorkspaceStore((state) => state.toggleFolder);
  const expandedFolderSet = useMemo(() => new Set(expandedFolders), [expandedFolders]);

  return (
    <div className="sidebar-section">
      <div className="section-header">
        <span>Workspace</span>
        <button onClick={() => useWorkspaceStore.getState().openCommandPalette("")} title="Quick open" type="button">
          <Command size={15} />
        </button>
      </div>
      <div className="import-actions">
        <button onClick={() => dispatchImportRequest("open-file")} type="button">
          <FileCode size={15} />
          Open File
        </button>
        <button onClick={() => dispatchImportRequest("open-folder")} type="button">
          <FolderOpen size={15} />
          Open Folder
        </button>
      </div>
      <FileTree
        activeFileId={activeFileId}
        depth={0}
        expandedFolders={expandedFolderSet}
        files={files}
        nodes={fileTree}
        openFile={openFile}
        toggleFolder={toggleFolder}
      />
    </div>
  );
}

function FileImportControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const folderInput = folderInputRef.current;
    folderInput?.setAttribute("webkitdirectory", "");
    folderInput?.setAttribute("directory", "");

    const openFile = () => fileInputRef.current?.click();
    const openFolder = () => {
      void openFolderPicker(folderInputRef.current);
    };

    window.addEventListener("code-workspace:open-file", openFile);
    window.addEventListener("code-workspace:open-folder", openFolder);

    return () => {
      window.removeEventListener("code-workspace:open-file", openFile);
      window.removeEventListener("code-workspace:open-folder", openFolder);
    };
  }, []);

  async function importFiles(fileList: FileList | null, sourceLabel: string, preferRelativePath = false, replaceWorkspace = false) {
    if (!fileList?.length) return;

    const store = useWorkspaceStore.getState();
    store.addTerminalLines([`Reading ${fileList.length} selected file item(s)...`]);
    const { files, skipped, limitReached } = await readBrowserFiles(fileList, preferRelativePath);

    if (files.length) {
      if (replaceWorkspace) store.replaceWorkspaceWithImportedFiles(files, sourceLabel);
      else store.addImportedFiles(files, sourceLabel);
    }
    if (skipped > 0) {
      store.addTerminalLines([`Skipped ${skipped} generated folder item(s) or oversized file(s) during import.`]);
    }
    if (limitReached) {
      store.addTerminalLines([`Stopped after ${files.length} files to keep the workspace responsive.`]);
    }
  }

  return (
    <>
      <input
        className="hidden-file-input"
        multiple
        onChange={(event) => {
          void importFiles(event.currentTarget.files, "open file");
          event.currentTarget.value = "";
        }}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
      <input
        className="hidden-file-input"
        multiple
        onChange={(event) => {
          void importFiles(event.currentTarget.files, "open folder", true, true);
          event.currentTarget.value = "";
        }}
        ref={folderInputRef}
        tabIndex={-1}
        type="file"
      />
    </>
  );
}

type FileSystemPermissionMode = "read" | "readwrite";

interface FileSystemHandleLike {
  kind: "file" | "directory";
  name: string;
}

interface FileSystemFileHandleLike extends FileSystemHandleLike {
  kind: "file";
  getFile: () => Promise<File>;
}

interface FileSystemDirectoryHandleLike extends FileSystemHandleLike {
  kind: "directory";
  entries: () => AsyncIterableIterator<[string, FileSystemHandleLike]>;
  requestPermission?: (descriptor?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState>;
  queryPermission?: (descriptor?: { mode?: FileSystemPermissionMode }) => Promise<PermissionState>;
}

interface WindowWithDirectoryPicker extends Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleLike>;
}

async function openFolderPicker(fallbackInput: HTMLInputElement | null) {
  const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;

  if (!picker) {
    fallbackInput?.click();
    return;
  }

  try {
    const directory = await picker();
    const permission = await ensureDirectoryPermission(directory);
    if (!permission) {
      useWorkspaceStore.getState().addTerminalLines(["Folder import was blocked by browser permissions."]);
      fallbackInput?.click();
      return;
    }

    useWorkspaceStore.getState().addTerminalLines([`Reading folder ${directory.name}...`]);
    const { files, skipped, limitReached } = await readDirectoryHandle(directory);
    const store = useWorkspaceStore.getState();

    if (files.length) store.replaceWorkspaceWithImportedFiles(files, directory.name);
    store.addTerminalLines([
      `Folder picker read ${files.length} file(s) from ${directory.name}.`,
      ...(skipped > 0 ? [`Skipped ${skipped} generated folder item(s) or oversized file(s).`] : []),
      ...(limitReached ? [`Stopped after ${files.length} files to keep the workspace responsive.`] : [])
    ]);

    if (!files.length) {
      fallbackInput?.click();
    }
  } catch (error) {
    const exception = error as DOMException;
    if (exception.name !== "AbortError") {
      useWorkspaceStore.getState().addTerminalLines([`Folder picker failed: ${exception.message || "unknown error"}`]);
      fallbackInput?.click();
    }
  }
}

async function ensureDirectoryPermission(directory: FileSystemDirectoryHandleLike) {
  if (!directory.queryPermission || !directory.requestPermission) return true;

  const current = await directory.queryPermission({ mode: "read" });
  if (current === "granted") return true;

  const requested = await directory.requestPermission({ mode: "read" });
  return requested === "granted";
}

const ignoredImportSegments = new Set(["node_modules", ".git", ".next", ".turbo"]);
const binaryImportExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".mp3",
  ".mp4",
  ".mov",
  ".wasm",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot"
]);

function dispatchImportRequest(kind: "open-file" | "open-folder") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(`code-workspace:${kind}`));
}

async function readBrowserFiles(fileList: FileList, preferRelativePath: boolean) {
  const maxFiles = maxImportedBrowserFiles;
  const maxFileSize = 1024 * 1024 * 250;
  const importedFiles: ImportedWorkspaceFile[] = [];
  let skipped = 0;
  let limitReached = false;

  for (let index = 0; index < fileList.length; index += 1) {
    if (importedFiles.length >= maxFiles) {
      skipped += fileList.length - index;
      limitReached = true;
      break;
    }

    if (index > 0 && index % importYieldBatchSize === 0) await yieldToBrowser();

    const file = fileList.item(index);
    if (!file) {
      skipped += 1;
      continue;
    }

    const path = getBrowserFilePath(file, preferRelativePath);
    if (!path || shouldSkipImport(path, file, maxFileSize)) {
      skipped += 1;
      continue;
    }

    importedFiles.push(await readImportedWorkspaceFile(file, path));
  }

  return { files: importedFiles, skipped, limitReached };
}

async function readDirectoryHandle(directory: FileSystemDirectoryHandleLike) {
  const maxFiles = maxImportedDirectoryFiles;
  const maxFileSize = 1024 * 1024 * 250;
  const importedFiles: ImportedWorkspaceFile[] = [];
  let skipped = 0;
  let inspected = 0;
  let limitReached = false;

  async function walk(currentDirectory: FileSystemDirectoryHandleLike, parentPath: string) {
    for await (const [, handle] of currentDirectory.entries()) {
      if (importedFiles.length >= maxFiles) {
        limitReached = true;
        return;
      }

      inspected += 1;
      if (inspected % importYieldBatchSize === 0) await yieldToBrowser();

      const path = normalizeImportPath(parentPath ? `${parentPath}/${handle.name}` : handle.name);
      const parts = path.split("/");

      if (parts.some((part) => ignoredImportSegments.has(part))) {
        skipped += 1;
        continue;
      }

      if (handle.kind === "directory") {
        await walk(handle as FileSystemDirectoryHandleLike, path);
        if (limitReached) return;
        continue;
      }

      const fileHandle = handle as FileSystemFileHandleLike;
      const file = await fileHandle.getFile();

      if (shouldSkipImport(path, file, maxFileSize)) {
        skipped += 1;
        continue;
      }

      importedFiles.push(await readImportedWorkspaceFile(file, normalizeImportPath(`${directory.name}/${path}`)));
    }
  }

  await walk(directory, "");
  return { files: importedFiles, skipped, limitReached };
}

function getBrowserFilePath(file: File, preferRelativePath: boolean) {
  const withRelativePath = file as File & { webkitRelativePath?: string };
  return normalizeImportPath(preferRelativePath && withRelativePath.webkitRelativePath ? withRelativePath.webkitRelativePath : file.name);
}

function shouldSkipImport(path: string, file: File, maxFileSize: number) {
  const parts = path.split("/");

  return (
    file.size > maxFileSize ||
    parts.some((part) => ignoredImportSegments.has(part))
  );
}

async function readImportedWorkspaceFile(file: File, path: string): Promise<ImportedWorkspaceFile> {
  const assetKind = getAssetKind(path, file);
  const blobKey = `asset:${path}:${file.size}:${file.lastModified}`;

  if (assetKind === "svg") {
    if (file.size > maxEditableTextFileSize) {
      await cacheAssetBlob(blobKey, file);
      return {
        name: file.name,
        path,
        content: createAssetPlaceholder(path, file, "binary"),
        assetKind: "binary",
        blobKey,
        mimeType: file.type || "image/svg+xml",
        size: file.size
      };
    }

    const content = await file.text();
    return {
      name: file.name,
      path,
      content,
      assetKind,
      dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`,
      mimeType: file.type || "image/svg+xml",
      size: file.size
    };
  }

  if (assetKind && assetKind !== "binary") {
    await cacheAssetBlob(blobKey, file);
    const dataUrl = URL.createObjectURL(file);
    return {
      name: file.name,
      path,
      content: createAssetPlaceholder(path, file, assetKind),
      assetKind,
      blobKey,
      dataUrl,
      mimeType: file.type,
      size: file.size
    };
  }

  if (assetKind === "binary") {
    await cacheAssetBlob(blobKey, file);
    return {
      name: file.name,
      path,
      content: createAssetPlaceholder(path, file, assetKind),
      assetKind,
      blobKey,
      mimeType: file.type,
      size: file.size
    };
  }

  if (!assetKind && file.size > maxEditableTextFileSize) {
    return {
      name: file.name,
      path,
      content: [
        `Large file: ${path}`,
        `Type: ${file.type || "text/plain"}`,
        `Size: ${formatBytes(file.size)}`,
        "",
        "This file was loaded as a lightweight placeholder to keep the workspace responsive."
      ].join("\n"),
      mimeType: file.type,
      size: file.size
    };
  }

  try {
    return {
      name: file.name,
      path,
      content: await file.text(),
      mimeType: file.type,
      size: file.size
    };
  } catch {
    return {
      name: file.name,
      path,
      content: createAssetPlaceholder(path, file, "binary"),
      assetKind: "binary",
      mimeType: file.type,
      size: file.size
    };
  }
}

function getAssetKind(path: string, file: File): ImportedWorkspaceFile["assetKind"] | undefined {
  const lowerPath = path.toLowerCase();
  const extension = lowerPath.includes(".") ? lowerPath.slice(lowerPath.lastIndexOf(".")) : "";
  if (extension === ".svg" || file.type === "image/svg+xml") return "svg";
  if (/^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|ico|bmp|avif)$/i.test(lowerPath)) return "image";
  if (/^video\//.test(file.type) || /\.(mp4|webm|ogg|mov|m4v)$/i.test(lowerPath)) return "video";
  if (/^audio\//.test(file.type) || /\.(mp3|wav|ogg|m4a|flac)$/i.test(lowerPath)) return "audio";
  if (binaryImportExtensions.has(extension) || /application\/pdf|application\/zip|application\/gzip|application\/wasm/.test(file.type)) return "binary";
  return undefined;
}

function createAssetPlaceholder(path: string, file: File, kind: NonNullable<ImportedWorkspaceFile["assetKind"]>) {
  return [
    `${kind.toUpperCase()} asset: ${path}`,
    `Type: ${file.type || "unknown"}`,
    `Size: ${formatBytes(file.size)}`,
    "",
    kind === "binary"
      ? "This file is included in the workspace tree, but the browser editor cannot render its raw binary contents."
      : "Use the preview pane to inspect this asset."
  ].join("\n");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

interface FileTreeProps {
  nodes: FileNode[];
  depth: number;
  expandedFolders: Set<string>;
  activeFileId: string | null;
  files: Record<string, WorkspaceFile>;
  openFile: (fileId: string) => void;
  toggleFolder: (folderId: string) => void;
}

const FileTree = memo(function FileTree({ activeFileId, depth, expandedFolders, files, nodes, openFile, toggleFolder }: FileTreeProps) {
  const [visibleLimit, setVisibleLimit] = useState(treeRenderBatchSize);
  const visibleNodes = nodes.length > visibleLimit ? nodes.slice(0, visibleLimit) : nodes;
  const remaining = nodes.length - visibleNodes.length;

  return (
    <div className="file-tree">
      {visibleNodes.map((node) => {
        const isFolder = node.type === "folder";
        const expanded = expandedFolders.has(node.id);
        const file = files[node.id];
        const modified = file?.modified;
        const fileIcon = !isFolder ? getFileIcon(node.name, node.language) : null;

        return (
          <div key={node.id}>
            <button
              className={`tree-row ${activeFileId === node.id ? "active" : ""}`}
              onClick={() => (isFolder ? toggleFolder(node.id) : openFile(node.id))}
              style={{ paddingLeft: 8 + depth * 14 }}
              title={node.path || node.name}
              type="button"
            >
              {isFolder ? (
                <>
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {expanded ? <FolderOpen size={15} /> : <Folder size={15} />}
                </>
              ) : (
                <>
                  <span className="tree-spacer" />
                  {fileIcon && <fileIcon.Icon className={`file-icon ${fileIcon.className}`} size={15} />}
                </>
              )}
              <span>{node.name}</span>
              {modified && <i aria-label="Modified file" />}
            </button>
            {isFolder && expanded && node.children && (
              <FileTree
                activeFileId={activeFileId}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                files={files}
                nodes={node.children}
                openFile={openFile}
                toggleFolder={toggleFolder}
              />
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <button className="tree-more-row" onClick={() => setVisibleLimit((limit) => limit + treeRenderBatchSize)} style={{ paddingLeft: 8 + depth * 14 }} type="button">
          Show {Math.min(treeRenderBatchSize, remaining)} more ({remaining} hidden)
        </button>
      )}
    </div>
  );
});

function SearchView() {
  const searchQuery = useWorkspaceStore((state) => state.searchQuery);
  const setSearchQuery = useWorkspaceStore((state) => state.setSearchQuery);
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const fileList = useMemo(() => flattenFiles(files), [files]);
  const results = useMemo(() => {
    const query = searchQuery.trim();

    if (!query) {
      return fileList.slice(0, 9).map((file) => ({ file, score: 1 }));
    }

    return fileList
      .map((file) => ({
        file,
        score: fuzzyScore(query, `${file.path} ${query.length > 1 && !file.assetKind ? file.content.slice(0, 300) : ""}`)
      }))
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 12);
  }, [fileList, searchQuery]);

  return (
    <div className="sidebar-section">
      <label className="input-label">
        <span>Search files</span>
        <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="component, css, test..." value={searchQuery} />
      </label>
      <div className="result-list">
        {results.map(({ file }) => (
          <button key={file.id} onClick={() => openFile(file.id)} type="button">
            <FileCode size={15} />
            <span>
              <strong>{file.name}</strong>
              <small>{file.path}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SourceControlView() {
  const files = useWorkspaceStore((state) => state.files);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const saveAllFiles = useWorkspaceStore((state) => state.saveAllFiles);
  const changedFiles = Object.values(files).filter((file) => file.modified);

  return (
    <div className="sidebar-section">
      <div className="source-actions">
        <input aria-label="Commit message" placeholder="Message" />
        <button onClick={saveAllFiles} type="button">
          Commit
        </button>
      </div>
      <div className="section-header">
        <span>Changes</span>
        <strong>{changedFiles.length}</strong>
      </div>
      <div className="result-list">
        {changedFiles.length === 0 && <p className="panel-copy">Working tree clean.</p>}
        {changedFiles.map((file) => (
          <button key={file.id} onClick={() => openFile(file.id)} type="button">
            <GitBranch size={15} />
            <span>
              <strong>{file.name}</strong>
              <small>M {file.path}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RunView() {
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const file = activeFileId ? files[activeFileId] : undefined;

  function run() {
    const store = useWorkspaceStore.getState();
    store.setBottomPanelView("terminal");
    store.addTerminalLines(simulateRun(file));
  }

  return (
    <div className="sidebar-section">
      <div className="run-card">
        <Code size={20} />
        <strong>{file?.name ?? "No file selected"}</strong>
        <p>{file ? `Configured as ${getLanguageLabel(file.language)}.` : "Open a file to run or debug it."}</p>
        <button onClick={run} type="button">
          <Play size={15} />
          Run active file
        </button>
      </div>
      <div className="debug-list">
        <span className="debug-item">Breakpoint support: simulated</span>
        <span className="debug-item">Watch expressions: activeFile.path</span>
        <span className="debug-item">Preview target: localhost:5173</span>
      </div>
    </div>
  );
}

function ExtensionsView({ extensionPanels }: { extensionPanels: ReturnType<typeof activateExtensions>["panels"] }) {
  const enabledExtensionIds = useWorkspaceStore((state) => state.enabledExtensionIds);
  const toggleExtension = useWorkspaceStore((state) => state.toggleExtension);

  return (
    <div className="sidebar-section extension-list">
      {builtinExtensions.map((extension) => {
        const enabled = enabledExtensionIds.includes(extension.id);
        return (
          <article className="extension-card" key={extension.id}>
            <div>
              <strong>{extension.displayName}</strong>
              <small>{extension.publisher}</small>
            </div>
            <p>{extension.description}</p>
            <button className={enabled ? "enabled" : ""} onClick={() => toggleExtension(extension.id)} type="button">
              {enabled ? "Enabled" : "Enable"}
            </button>
          </article>
        );
      })}

      <div className="section-header">
        <span>Contributed Panels</span>
      </div>
      {extensionPanels.map((panel) => (
        <section className="contributed-panel" key={panel.id}>
          <strong>{panel.title}</strong>
          <panel.Component extensionId={panel.extensionId} />
        </section>
      ))}
    </div>
  );
}

function SettingsView() {
  const minimap = useWorkspaceStore((state) => state.minimap);
  const splitView = useWorkspaceStore((state) => state.splitView);
  const syncScroll = useWorkspaceStore((state) => state.syncScroll);
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const toggleMinimap = useWorkspaceStore((state) => state.toggleMinimap);
  const toggleSplitView = useWorkspaceStore((state) => state.toggleSplitView);
  const toggleSyncScroll = useWorkspaceStore((state) => state.toggleSyncScroll);

  return (
    <div className="sidebar-section settings-list">
      <div className="settings-group">
        <div className="section-header">
          <span>Theme</span>
          <Palette size={15} />
        </div>
        <div className="segmented">
          {(["dark", "light", "contrast"] as const).map((item) => (
            <button className={theme === item ? "active" : ""} key={item} onClick={() => setTheme(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </div>
      <ToggleRow enabled={minimap} label="Minimap" onToggle={toggleMinimap} />
      <ToggleRow enabled={splitView} label="Split editor" onToggle={toggleSplitView} />
      <ToggleRow enabled={syncScroll} label="Scroll sync" onToggle={toggleSyncScroll} />
      <div className="settings-group">
        <div className="section-header">
          <span>Keybindings</span>
          <Keyboard size={15} />
        </div>
        <kbd>Ctrl+P</kbd>
        <kbd>Ctrl+S</kbd>
        <kbd>Ctrl+Enter</kbd>
        <kbd>Ctrl+`</kbd>
      </div>
    </div>
  );
}

function ToggleRow({ enabled, label, onToggle }: { enabled: boolean; label: string; onToggle: () => void }) {
  return (
    <button className="toggle-row" onClick={onToggle} type="button">
      <span>{label}</span>
      <i className={enabled ? "enabled" : ""} />
    </button>
  );
}

function TopBar() {
  const openCommandPalette = useWorkspaceStore((state) => state.openCommandPalette);
  const saveActiveFile = useWorkspaceStore((state) => state.saveActiveFile);
  const toggleSplitView = useWorkspaceStore((state) => state.toggleSplitView);
  const toggleBottomPanel = useWorkspaceStore((state) => state.toggleBottomPanel);

  return (
    <header className="top-bar">
      <MenuStrip />
      <button className="command-center" onClick={() => openCommandPalette("")} type="button">
        <Search size={15} />
        <span>Search files and commands</span>
        <kbd>Ctrl P</kbd>
      </button>
      <div className="top-actions">
        <button onClick={saveActiveFile} title="Save" type="button">
          <Save size={16} />
        </button>
        <button onClick={runActiveFileFromMenu} title="Run active file" type="button">
          <Play size={16} />
        </button>
        <button onClick={toggleSplitView} title="Toggle split editor" type="button">
          <Code size={16} />
        </button>
        <button onClick={toggleBottomPanel} title="Toggle bottom panel" type="button">
          <Terminal size={16} />
        </button>
      </div>
    </header>
  );
}

type MenuName = "file" | "edit" | "selection" | "terminal";

function MenuStrip() {
  const [openMenu, setOpenMenu] = useState<MenuName | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  function run(action: () => void) {
    action();
    setOpenMenu(null);
  }

  return (
    <div className="menu-strip" ref={menuRef}>
      <WorkbenchMenu label="File" menu="file" openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <MenuItem label="Open File..." shortcut="Ctrl+O" onSelect={() => run(() => dispatchImportRequest("open-file"))} />
        <MenuItem label="Open Folder..." onSelect={() => run(() => dispatchImportRequest("open-folder"))} />
        <MenuDivider />
        <MenuItem label="Save" shortcut="Ctrl+S" onSelect={() => run(() => useWorkspaceStore.getState().saveActiveFile())} />
        <MenuItem label="Save All" onSelect={() => run(() => useWorkspaceStore.getState().saveAllFiles())} />
        <MenuDivider />
        <MenuItem label="Command Palette..." shortcut="Ctrl+P" onSelect={() => run(() => useWorkspaceStore.getState().openCommandPalette(""))} />
        <MenuItem label="Reset Demo Workspace" onSelect={() => run(() => useWorkspaceStore.getState().resetWorkspace())} />
      </WorkbenchMenu>

      <WorkbenchMenu label="Edit" menu="edit" openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <MenuItem label="Undo" shortcut="Ctrl+Z" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("undo"))} />
        <MenuItem label="Redo" shortcut="Ctrl+Y" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("redo"))} />
        <MenuDivider />
        <MenuItem label="Cut" shortcut="Ctrl+X" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.clipboardCutAction"))} />
        <MenuItem label="Copy" shortcut="Ctrl+C" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.clipboardCopyAction"))} />
        <MenuItem label="Paste" shortcut="Ctrl+V" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.clipboardPasteAction"))} />
        <MenuDivider />
        <MenuItem label="Find" shortcut="Ctrl+F" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("actions.find"))} />
        <MenuItem label="Replace" shortcut="Ctrl+H" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.startFindReplaceAction"))} />
      </WorkbenchMenu>

      <WorkbenchMenu label="Selection" menu="selection" openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <MenuItem label="Select All" shortcut="Ctrl+A" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.selectAll"))} />
        <MenuItem label="Add Selection To Next Match" shortcut="Ctrl+D" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.addSelectionToNextFindMatch"))} />
        <MenuItem label="Add Cursor Above" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.insertCursorAbove"))} />
        <MenuItem label="Add Cursor Below" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.insertCursorBelow"))} />
        <MenuDivider />
        <MenuItem label="Expand Selection" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.smartSelect.expand"))} />
        <MenuItem label="Shrink Selection" onSelect={() => run(() => useWorkspaceStore.getState().queueEditorAction("editor.action.smartSelect.shrink"))} />
      </WorkbenchMenu>

      <WorkbenchMenu label="Terminal" menu="terminal" openMenu={openMenu} setOpenMenu={setOpenMenu}>
        <MenuItem label="Toggle Terminal" shortcut="Ctrl+`" onSelect={() => run(() => useWorkspaceStore.getState().toggleBottomPanel())} />
        <MenuItem label="Focus Terminal" onSelect={() => run(() => useWorkspaceStore.getState().setBottomPanelView("terminal"))} />
        <MenuItem label="Clear Terminal" onSelect={() => run(() => useWorkspaceStore.getState().clearTerminal())} />
        <MenuDivider />
        <MenuItem label="Run Active File" shortcut="Ctrl+Enter" onSelect={() => run(runActiveFileFromMenu)} />
        <MenuItem label="Serve HTML Preview" onSelect={() => run(serveHtmlPreviewFromMenu)} />
        <MenuItem label="Show Output" onSelect={() => run(() => useWorkspaceStore.getState().setBottomPanelView("output"))} />
        <MenuItem label="Show Debug Console" onSelect={() => run(() => useWorkspaceStore.getState().setBottomPanelView("debug"))} />
      </WorkbenchMenu>
    </div>
  );
}

function WorkbenchMenu({
  children,
  label,
  menu,
  openMenu,
  setOpenMenu
}: {
  children: React.ReactNode;
  label: string;
  menu: MenuName;
  openMenu: MenuName | null;
  setOpenMenu: (menu: MenuName | null) => void;
}) {
  const open = openMenu === menu;

  return (
    <div className="workbench-menu">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={open ? "active" : ""}
        onClick={() => setOpenMenu(open ? null : menu)}
        onPointerEnter={() => {
          if (openMenu) setOpenMenu(menu);
        }}
        type="button"
      >
        {label}
      </button>
      {open && (
        <div className="menu-dropdown" role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onSelect, shortcut }: { label: string; onSelect: () => void; shortcut?: string }) {
  return (
    <button className="menu-item" onClick={onSelect} role="menuitem" type="button">
      <span>{label}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </button>
  );
}

function MenuDivider() {
  return <div className="menu-divider" role="separator" />;
}

function runActiveFileFromMenu() {
  const store = useWorkspaceStore.getState();
  const file = store.activeFileId ? store.files[store.activeFileId] : undefined;

  if (file && isHtmlWorkspaceFile(file)) {
    store.setPreviewPath(file.path);
    store.setBottomPanelView("preview");
    const result = openPreviewTabForPath(file.path);
    store.addTerminalLines([`Serving ${file.path}`, "Local URL: http://localhost:5173/", getPreviewOpenMessage(result)]);
    return;
  }

  store.setBottomPanelView("terminal");
  store.addTerminalLines(simulateRun(file));
}

function serveHtmlPreviewFromMenu() {
  const store = useWorkspaceStore.getState();
  const files = flattenFiles(store.files);
  const activeFile = store.activeFileId ? store.files[store.activeFileId] : undefined;
  const htmlFile = findBestHtmlFile(files, activeFile?.path ?? store.previewPath);

  store.setBottomPanelView("preview");

  if (!htmlFile) {
    store.addTerminalLines(["localhost: no index.html or HTML file found in this workspace."]);
    return;
  }

  store.setPreviewPath(htmlFile.path);
  const result = openPreviewTabForPath(htmlFile.path);
  store.addTerminalLines([`Serving ${htmlFile.path}`, "Local URL: http://localhost:5173/", getPreviewOpenMessage(result)]);
}

function EditorTabs() {
  const openTabs = useWorkspaceStore((state) => state.openTabs);
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const setActiveFile = useWorkspaceStore((state) => state.setActiveFile);
  const closeTab = useWorkspaceStore((state) => state.closeTab);

  return (
    <div className="tab-bar" role="tablist">
      {openTabs.map((fileId) => {
        const file = files[fileId];
        if (!file) return null;
        const fileIcon = getFileIcon(file.name, file.language);
        return (
          <button
            className={activeFileId === fileId ? "active" : ""}
            key={fileId}
            onClick={() => setActiveFile(fileId)}
            role="tab"
            type="button"
          >
            <fileIcon.Icon className={`file-icon ${fileIcon.className}`} size={14} />
            <span>{file.name}</span>
            {file.modified && <i />}
            <span
              className="tab-close"
              onClick={(event) => {
                event.stopPropagation();
                closeTab(fileId);
              }}
              role="button"
              tabIndex={0}
              title="Close"
            >
              <X size={13} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getFileIcon(name: string, language?: string): { Icon: LucideIcon; className: string } {
  const lower = name.toLowerCase();

  if (lower === "package.json") return { Icon: FileJson, className: "file-icon-package" };
  if (lower.includes("config") || lower.startsWith(".env") || lower === "dockerfile") {
    return { Icon: Settings2, className: "file-icon-config" };
  }
  if (language === "typescript" || lower.endsWith(".tsx") || lower.endsWith(".ts")) {
    return { Icon: Code, className: "file-icon-ts" };
  }
  if (language === "javascript" || lower.endsWith(".jsx") || lower.endsWith(".js") || lower.endsWith(".mjs")) {
    return { Icon: Code, className: "file-icon-js" };
  }
  if (language === "css" || lower.endsWith(".scss") || lower.endsWith(".sass")) {
    return { Icon: Palette, className: "file-icon-css" };
  }
  if (language === "html") return { Icon: Code, className: "file-icon-html" };
  if (language === "json") return { Icon: FileJson, className: "file-icon-json" };
  if (language === "markdown") return { Icon: FileText, className: "file-icon-md" };
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(lower)) return { Icon: FileVideo, className: "file-icon-video" };
  if (/\.(mp3|wav|ogg|m4a|flac)$/i.test(lower)) return { Icon: FileAudio, className: "file-icon-audio" };
  if (language === "asset" || /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i.test(lower)) {
    return { Icon: FileImage, className: "file-icon-asset" };
  }
  if (language === "sql") return { Icon: Database, className: "file-icon-db" };
  if (language === "python") return { Icon: Code, className: "file-icon-python" };
  if (language === "yaml" || language === "toml") return { Icon: Settings2, className: "file-icon-config" };

  return { Icon: FileText, className: "file-icon-text" };
}

function EditorArea({ snippets }: { snippets: ReturnType<typeof activateExtensions>["snippets"] }) {
  const splitView = useWorkspaceStore((state) => state.splitView);
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const openCommandPalette = useWorkspaceStore((state) => state.openCommandPalette);

  if (!activeFileId) {
    return (
      <section className="welcome-editor">
        <Code size={44} />
        <h1>Code Workspace</h1>
        <p>Open a file from Explorer or jump in with the command palette.</p>
        <div className="welcome-actions">
          <button onClick={() => openCommandPalette("")} type="button">
            <Command size={16} />
            Open command palette
          </button>
          <button onClick={() => useWorkspaceStore.getState().openFileByPath("README.md")} type="button">
            Open README
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={`editor-area ${splitView ? "split" : ""}`}>
      <EditorPane paneId="primary" snippets={snippets} />
      {splitView && <EditorPane paneId="secondary" readOnly snippets={snippets} />}
    </section>
  );
}

function BottomPanel() {
  const bottomPanelOpen = useWorkspaceStore((state) => state.bottomPanelOpen);
  const bottomPanelView = useWorkspaceStore((state) => state.bottomPanelView);
  const panelHeight = useWorkspaceStore((state) => state.panelHeight);
  const setBottomPanelView = useWorkspaceStore((state) => state.setBottomPanelView);
  const setPanelHeight = useWorkspaceStore((state) => state.setPanelHeight);
  const toggleBottomPanel = useWorkspaceStore((state) => state.toggleBottomPanel);
  const files = useWorkspaceStore((state) => state.files);

  if (!bottomPanelOpen) return null;

  const modifiedFiles = Object.values(files).filter((file) => file.modified);

  function beginResize(event: React.PointerEvent<HTMLDivElement>) {
    const startY = event.clientY;
    const startHeight = panelHeight;

    const move = (moveEvent: PointerEvent) => setPanelHeight(startHeight - (moveEvent.clientY - startY));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <section className="bottom-panel" style={{ height: panelHeight }}>
      <div aria-hidden="true" className="panel-resize" onPointerDown={beginResize} />
      <div className="panel-header">
        <div className="panel-tabs">
          {(["terminal", "problems", "output", "debug", "preview"] as const).map((tab) => (
            <button className={bottomPanelView === tab ? "active" : ""} key={tab} onClick={() => setBottomPanelView(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>
        <button className="panel-close" onClick={toggleBottomPanel} title="Close panel" type="button">
          <X size={15} />
        </button>
      </div>
      <div className="panel-content">
        {bottomPanelView === "terminal" && <TerminalPane />}
        {bottomPanelView === "problems" && (
          <div className="panel-placeholder">
            <strong>No blocking diagnostics.</strong>
            <p>Monaco will surface syntax diagnostics inline while editing.</p>
          </div>
        )}
        {bottomPanelView === "output" && <OutputLog />}
        {bottomPanelView === "preview" && <LocalhostPreview />}
        {bottomPanelView === "debug" && (
          <div className="debug-grid">
            <div>
              <strong>Watch</strong>
              <span>modifiedFiles: {modifiedFiles.length}</span>
              <span>breakpoints: simulated</span>
            </div>
            <div>
              <strong>Call Stack</strong>
              <span>main.tsx: createRoot</span>
              <span>App.tsx: render panels</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OutputLog() {
  const terminalLog = useWorkspaceStore((state) => state.terminalLog);

  return (
    <pre className="output-log">
      {terminalLog.length ? terminalLog.join("\n") : "Output channel is empty."}
    </pre>
  );
}

function LocalhostPreview() {
  const filesRecord = useWorkspaceStore((state) => state.files);
  const previewPath = useWorkspaceStore((state) => state.previewPath);
  const setPreviewPath = useWorkspaceStore((state) => state.setPreviewPath);
  const openFileByPath = useWorkspaceStore((state) => state.openFileByPath);
  const [refreshKey, setRefreshKey] = useState(0);
  const [srcDoc, setSrcDoc] = useState("");
  const [error, setError] = useState("");
  const files = useMemo(() => flattenFiles(filesRecord), [filesRecord]);
  const htmlFile = useMemo(() => findBestHtmlFile(files, previewPath), [files, previewPath]);

  useEffect(() => {
    let cancelled = false;
    let objectUrls: string[] = [];

    if (!htmlFile) {
      return undefined;
    }

    buildPreviewDocument(htmlFile, files)
      .then((document) => {
        if (cancelled) {
          document.objectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        objectUrls = document.objectUrls;
        setError("");
        if (!cancelled) setSrcDoc(document.html);
      })
      .catch((previewError: unknown) => {
        if (!cancelled) {
          setSrcDoc("");
          setError(previewError instanceof Error ? previewError.message : "Preview failed to load.");
        }
      });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, htmlFile, refreshKey]);

  if (!htmlFile) {
    return (
      <div className="localhost-preview localhost-preview--empty">
        <strong>No HTML entry found.</strong>
        <p>Open a folder with an index.html file, or run serve path/to/file.html from the terminal.</p>
      </div>
    );
  }

  return (
    <div className="localhost-preview">
      <div className="localhost-preview__toolbar">
        <span>http://localhost:5173/</span>
        <code>{htmlFile.path}</code>
        <button onClick={() => setRefreshKey((key) => key + 1)} title="Refresh preview" type="button">
          <RefreshCw size={14} />
        </button>
        <button onClick={() => openPreviewTabForPath(htmlFile.path)} type="button">
          <ExternalLink size={14} />
          Open Tab
        </button>
        <button onClick={() => openFileByPath(htmlFile.path)} type="button">
          Open File
        </button>
        {previewPath !== htmlFile.path && (
          <button onClick={() => setPreviewPath(htmlFile.path)} type="button">
            Use This Entry
          </button>
        )}
      </div>
      {error ? (
        <div className="localhost-preview__error">{error}</div>
      ) : (
        <iframe
          key={`${htmlFile.path}-${refreshKey}`}
          sandbox="allow-forms allow-modals allow-popups allow-scripts"
          srcDoc={srcDoc}
          title={`Localhost preview for ${htmlFile.path}`}
        />
      )}
    </div>
  );
}

function findBestHtmlFile(files: WorkspaceFile[], preferredPath?: string | null) {
  const normalizedPath = preferredPath ? normalizeImportPath(preferredPath) : "";

  if (normalizedPath) {
    const exact = files.find((file) => file.path === normalizedPath && isHtmlWorkspaceFile(file));
    if (exact) return exact;

    const nestedIndex = files.find((file) => file.path.startsWith(`${normalizedPath}/`) && file.name.toLowerCase() === "index.html");
    if (nestedIndex) return nestedIndex;
  }

  return files.find((file) => file.name.toLowerCase() === "index.html") ?? files.find(isHtmlWorkspaceFile);
}

function isHtmlWorkspaceFile(file: WorkspaceFile) {
  return file.language === "html" || /\.html?$/i.test(file.path);
}

function openPreviewTabForPath(path?: string | null): PreviewTabOpenResult {
  if (typeof window === "undefined") return "blocked";

  const store = useWorkspaceStore.getState();
  const files = flattenFiles(store.files);
  const htmlFile = findBestHtmlFile(files, path ?? store.previewPath);

  if (!htmlFile) return "missing";

  store.setPreviewPath(htmlFile.path);
  store.setBottomPanelView("preview");

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) return "blocked";

  detachPreviewOpener(previewWindow);
  writePreviewTabDocument(
    previewWindow,
    createPreviewShellDocument("Loading preview...", `Preparing ${escapeHtml(htmlFile.path)}.`)
  );

  buildPreviewDocument(htmlFile, files)
    .then((document) => {
      let cleaned = false;
      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        document.objectUrls.forEach((url) => URL.revokeObjectURL(url));
      };

      writePreviewTabDocument(previewWindow, document.html);
      previewWindow.addEventListener("beforeunload", cleanup, { once: true });
    })
    .catch((error: unknown) => {
      writePreviewTabDocument(
        previewWindow,
        createPreviewShellDocument("Preview failed", error instanceof Error ? error.message : "The local preview could not be generated.")
      );
    });

  return "opened";
}

function detachPreviewOpener(previewWindow: Window) {
  try {
    previewWindow.opener = null;
  } catch {
    // Some browsers lock this down. The preview still runs as a local generated tab.
  }
}

function writePreviewTabDocument(previewWindow: Window, html: string) {
  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
}

function createPreviewShellDocument(title: string, message: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      html,body{height:100%;margin:0;background:#1e1e1e;color:#d4d4d4;font-family:Consolas,monospace}
      body{display:grid;place-items:center}
      main{max-width:560px;border:1px solid #333842;background:#252526;padding:22px}
      h1{margin:0 0 10px;font:600 18px system-ui,sans-serif}
      p{margin:0;line-height:1.55;color:#b8b8b8}
    </style>
  </head>
  <body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body>
</html>`;
}

function getPreviewOpenMessage(result: PreviewTabOpenResult) {
  if (result === "opened") return "Preview opened in a new browser tab.";
  if (result === "blocked") return "Popup blocked. Use the PREVIEW panel's Open Tab button.";
  return "No HTML entry found for preview.";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function buildPreviewDocument(htmlFile: WorkspaceFile, files: WorkspaceFile[]) {
  const objectUrls: string[] = [];
  const resourceUrls = new Map<string, string>();
  const resolvingPaths = new Set<string>();
  const html = await rewriteHtmlContent(htmlFile, htmlFile.content, files, objectUrls, resourceUrls, resolvingPaths);

  return { html: injectPreviewBase(html), objectUrls };
}

async function rewriteHtmlContent(
  file: WorkspaceFile,
  content: string,
  files: WorkspaceFile[],
  objectUrls: string[],
  resourceUrls: Map<string, string>,
  resolvingPaths: Set<string>
) {
  const directory = file.path.split("/").slice(0, -1).join("/");
  const localReferences = collectAttributeReferences(content);
  const resolvedReferences = new Map<string, string>();

  for (const reference of localReferences) {
    const path = resolvePreviewReference(directory, reference);
    const target = files.find((entry) => entry.path === path);
    if (!target) continue;

    const url = await createPreviewResourceUrl(target, files, objectUrls, resourceUrls, resolvingPaths);
    if (url) resolvedReferences.set(reference, url);
  }

  return content.replace(/\b(src|href)=["']([^"']+)["']/gi, (match, attribute: string, reference: string) => {
    const resolved = resolvedReferences.get(reference);
    return resolved ? `${attribute}="${resolved}"` : match;
  });
}

function collectAttributeReferences(html: string) {
  const references = new Set<string>();
  const pattern = /\b(?:src|href)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    const reference = match[1];
    if (!shouldRewritePreviewReference(reference)) continue;
    references.add(reference);
  }

  return references;
}

function shouldRewritePreviewReference(reference: string) {
  return !/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(reference);
}

function resolvePreviewReference(htmlDirectory: string, reference: string) {
  const [pathWithoutHash] = reference.split("#");
  const [pathWithoutQuery] = pathWithoutHash.split("?");
  let cleanReference = pathWithoutQuery;

  try {
    cleanReference = decodeURIComponent(pathWithoutQuery);
  } catch {
    cleanReference = pathWithoutQuery;
  }

  const absolute = cleanReference.startsWith("/") ? cleanReference.slice(1) : htmlDirectory ? `${htmlDirectory}/${cleanReference}` : cleanReference;
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

async function createPreviewResourceUrl(
  file: WorkspaceFile,
  files: WorkspaceFile[],
  objectUrls: string[],
  resourceUrls: Map<string, string>,
  resolvingPaths: Set<string>
) {
  const cached = resourceUrls.get(file.path);
  if (cached) return cached;

  if (file.dataUrl) {
    resourceUrls.set(file.path, file.dataUrl);
    return file.dataUrl;
  }

  if (file.blobKey) {
    const cachedBlob = await getCachedAssetBlob(file.blobKey);
    if (cachedBlob) {
      const url = URL.createObjectURL(cachedBlob);
      objectUrls.push(url);
      resourceUrls.set(file.path, url);
      return url;
    }
  }

  if (file.assetKind && file.assetKind !== "svg") return "";

  if (resolvingPaths.has(file.path)) return "";
  resolvingPaths.add(file.path);

  const content = await rewriteResourceContent(file, files, objectUrls, resourceUrls, resolvingPaths).finally(() => {
    resolvingPaths.delete(file.path);
  });

  const blob = new Blob([content], { type: getPreviewMimeType(file) });
  const url = URL.createObjectURL(blob);
  objectUrls.push(url);
  resourceUrls.set(file.path, url);
  return url;
}

async function rewriteResourceContent(
  file: WorkspaceFile,
  files: WorkspaceFile[],
  objectUrls: string[],
  resourceUrls: Map<string, string>,
  resolvingPaths: Set<string>
) {
  if (isHtmlWorkspaceFile(file)) {
    return rewriteHtmlContent(file, file.content, files, objectUrls, resourceUrls, resolvingPaths);
  }

  if (/\.(css|scss|sass|less)$/i.test(file.path)) {
    return rewriteCssContent(file, files, objectUrls, resourceUrls, resolvingPaths);
  }

  if (/\.(mjs|cjs|js|jsx|ts|tsx)$/i.test(file.path)) {
    return rewriteJavaScriptContent(file, files, objectUrls, resourceUrls, resolvingPaths);
  }

  return file.content;
}

async function rewriteCssContent(
  file: WorkspaceFile,
  files: WorkspaceFile[],
  objectUrls: string[],
  resourceUrls: Map<string, string>,
  resolvingPaths: Set<string>
) {
  const directory = file.path.split("/").slice(0, -1).join("/");
  const references = collectCssReferences(file.content);
  const resolvedReferences = new Map<string, string>();

  for (const reference of references) {
    const path = resolvePreviewReference(directory, reference);
    const target = files.find((entry) => entry.path === path);
    if (!target) continue;

    const url = await createPreviewResourceUrl(target, files, objectUrls, resourceUrls, resolvingPaths);
    if (url) resolvedReferences.set(reference, url);
  }

  return file.content.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote: string, reference: string) => {
    const resolved = resolvedReferences.get(reference);
    return resolved ? `url("${resolved}")` : match;
  });
}

function collectCssReferences(css: string) {
  const references = new Set<string>();
  const pattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(css))) {
    const reference = match[2];
    if (!shouldRewritePreviewReference(reference)) continue;
    references.add(reference);
  }

  return references;
}

async function rewriteJavaScriptContent(
  file: WorkspaceFile,
  files: WorkspaceFile[],
  objectUrls: string[],
  resourceUrls: Map<string, string>,
  resolvingPaths: Set<string>
) {
  const directory = file.path.split("/").slice(0, -1).join("/");
  const references = collectJavaScriptReferences(file.content);
  const resolvedReferences = new Map<string, string>();

  for (const reference of references) {
    const path = resolvePreviewReference(directory, reference);
    const target = files.find((entry) => entry.path === path);
    if (!target) continue;

    const url = await createPreviewResourceUrl(target, files, objectUrls, resourceUrls, resolvingPaths);
    if (url) resolvedReferences.set(reference, url);
  }

  return file.content.replace(
    /\b(?:import\s+(?:[^"'()]*?\s+from\s+)?|export\s+[^"']*?\s+from\s+|import\s*\(\s*)(["'])([^"']+)\1/g,
    (match, quote: string, reference: string) => {
      const resolved = resolvedReferences.get(reference);
      return resolved ? match.replace(`${quote}${reference}${quote}`, `${quote}${resolved}${quote}`) : match;
    }
  );
}

function collectJavaScriptReferences(source: string) {
  const references = new Set<string>();
  const pattern = /\b(?:import\s+(?:[^"'()]*?\s+from\s+)?|export\s+[^"']*?\s+from\s+|import\s*\(\s*)(["'])([^"']+)\1/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const reference = match[2];
    if (!shouldRewritePreviewReference(reference)) continue;
    references.add(reference);
  }

  return references;
}

function getPreviewMimeType(file: WorkspaceFile) {
  const lower = file.path.toLowerCase();
  if (file.mimeType) return file.mimeType;
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "text/javascript";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".wasm")) return "application/wasm";
  return "text/plain";
}

function injectPreviewBase(html: string) {
  const script = `<script>window.__CODE_WORKSPACE_LOCALHOST__={origin:"http://localhost:5173"};</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${script}`);
  return `${script}${html}`;
}

function StatusBar({ statusItems }: { statusItems: ReturnType<typeof activateExtensions>["statusItems"] }) {
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const theme = useWorkspaceStore((state) => state.theme);
  const file = activeFileId ? files[activeFileId] : undefined;

  return (
    <footer className="status-bar">
      <span>
        <GitBranch size={14} /> main
      </span>
      <span>{file ? getLanguageLabel(file.language) : "No file"}</span>
      <span>{file?.modified ? "Unsaved" : "Saved"}</span>
      <span>{theme}</span>
      {statusItems.map((item) => (
        <span className={item.tone ? `tone-${item.tone}` : undefined} key={item.id}>
          {item.label}
        </span>
      ))}
    </footer>
  );
}
