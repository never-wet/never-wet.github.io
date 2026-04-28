"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ActivityView, BottomPanelView, FileNode, ImportedWorkspaceFile, WorkspaceFile, WorkspaceTheme } from "@/lib/types";
import { cloneInitialFileTree, cloneInitialFiles, initialExpandedFolders } from "@/lib/workspace-data";
import { importedFileId, importedFolderId, inferLanguageFromPath, normalizeImportPath } from "@/lib/workspace-utils";

interface WorkspaceState {
  activityView: ActivityView;
  bottomPanelView: BottomPanelView;
  bottomPanelOpen: boolean;
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;
  editorScrollTop: number;
  enabledExtensionIds: string[];
  expandedFolders: string[];
  fileTree: FileNode[];
  files: Record<string, WorkspaceFile>;
  minimap: boolean;
  openTabs: string[];
  activeFileId: string | null;
  pendingEditorAction: string | null;
  pendingSnippet: string | null;
  panelHeight: number;
  previewPath: string | null;
  searchQuery: string;
  sidebarWidth: number;
  splitView: boolean;
  syncScroll: boolean;
  terminalLog: string[];
  theme: WorkspaceTheme;
  addImportedFiles: (importedFiles: ImportedWorkspaceFile[], sourceLabel?: string) => void;
  replaceWorkspaceWithImportedFiles: (importedFiles: ImportedWorkspaceFile[], sourceLabel?: string) => void;
  addTerminalLines: (lines: string[]) => void;
  copyPath: (fromPath: string, toPath: string) => boolean;
  createFile: (path: string, content?: string) => void;
  createFolder: (path: string) => void;
  clearTerminal: () => void;
  closeCommandPalette: () => void;
  closeTab: (fileId: string) => void;
  consumeEditorAction: () => string | null;
  consumeSnippet: () => string | null;
  cycleTheme: () => void;
  deletePath: (path: string) => boolean;
  movePath: (fromPath: string, toPath: string) => boolean;
  openCommandPalette: (query?: string) => void;
  openFile: (fileId: string) => void;
  openFileByPath: (path: string) => boolean;
  queueEditorAction: (actionId: string) => void;
  queueSnippet: (body: string) => void;
  resetWorkspace: () => void;
  saveActiveFile: () => void;
  saveAllFiles: () => void;
  setActivityView: (view: ActivityView) => void;
  setActiveFile: (fileId: string) => void;
  setBottomPanelView: (view: BottomPanelView) => void;
  setCommandPaletteQuery: (query: string) => void;
  setEditorScrollTop: (scrollTop: number) => void;
  setPanelHeight: (height: number) => void;
  setPreviewPath: (path: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarWidth: (width: number) => void;
  setTheme: (theme: WorkspaceTheme) => void;
  toggleBottomPanel: () => void;
  toggleExtension: (extensionId: string) => void;
  toggleFolder: (folderId: string) => void;
  toggleMinimap: () => void;
  toggleSplitView: () => void;
  toggleSyncScroll: () => void;
  updateFileContent: (fileId: string, content: string) => void;
}

const defaultExtensionIds = ["workspace-snippets", "preview-runner", "git-insights", "theme-lab"];
const largeWorkspaceFileCount = 260;
const persistWorkspaceFileLimit = 180;
const persistWorkspaceCharacterLimit = 900_000;
const persistedExpandedFolderLimit = 220;

function selectNextTab(openTabs: string[], closingId: string, activeFileId: string | null) {
  if (activeFileId !== closingId) return activeFileId;
  const currentIndex = openTabs.indexOf(closingId);
  const nextTabs = openTabs.filter((id) => id !== closingId);
  return nextTabs[Math.max(0, currentIndex - 1)] ?? nextTabs[0] ?? null;
}

function cloneTree(nodes: FileNode[]): FileNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined
  }));
}

function insertFileNode(nodes: FileNode[], file: WorkspaceFile, expandedFolders: Set<string>, autoExpandDepth = Number.POSITIVE_INFINITY) {
  const parts = normalizeImportPath(file.path).split("/").filter(Boolean);
  if (!parts.length) return;

  let children = nodes;
  let folderPath = "";

  parts.forEach((part, index) => {
    const isFile = index === parts.length - 1;

    if (isFile) {
      const existing = children.find((node) => node.type === "file" && node.path === file.path);
      const nextNode: FileNode = {
        id: file.id,
        name: file.name,
        path: file.path,
        type: "file",
        language: file.language
      };

      if (existing) {
        Object.assign(existing, nextNode);
      } else {
        children.push(nextNode);
      }
      return;
    }

    folderPath = folderPath ? `${folderPath}/${part}` : part;
    const folderId = importedFolderId(folderPath);
    let folder = children.find((node) => node.type === "folder" && node.path === folderPath);

    if (!folder) {
      folder = {
        id: folderId,
        name: part,
        path: folderPath,
        type: "folder",
        children: []
      };
      children.push(folder);
    }

    folder.children ??= [];
    if (index < autoExpandDepth) expandedFolders.add(folder.id);
    children = folder.children;
  });
}

function sortTree(nodes: FileNode[]) {
  nodes.sort((left, right) => {
    if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
    return left.name.localeCompare(right.name);
  });

  nodes.forEach((node) => {
    if (node.children) sortTree(node.children);
  });
}

function collectFolderPaths(nodes: FileNode[], paths = new Set<string>()) {
  nodes.forEach((node) => {
    if (node.type !== "folder") return;
    if (node.path) paths.add(node.path);
    if (node.children) collectFolderPaths(node.children, paths);
  });
  return paths;
}

function insertFolderNode(nodes: FileNode[], path: string, expandedFolders: Set<string>, autoExpandDepth = Number.POSITIVE_INFINITY) {
  const parts = normalizeImportPath(path).split("/").filter(Boolean);
  let children = nodes;
  let folderPath = "";

  parts.forEach((part, index) => {
    folderPath = folderPath ? `${folderPath}/${part}` : part;
    const folderId = importedFolderId(folderPath);
    let folder = children.find((node) => node.type === "folder" && node.path === folderPath);

    if (!folder) {
      folder = {
        id: folderId,
        name: part,
        path: folderPath,
        type: "folder",
        children: []
      };
      children.push(folder);
    }

    folder.children ??= [];
    if (index < autoExpandDepth) expandedFolders.add(folder.id);
    children = folder.children;
  });
}

function rebuildTree(files: Record<string, WorkspaceFile>, folderPaths: Set<string>, expandedFolders: Set<string>, autoExpandDepth = 0) {
  const tree: FileNode[] = [];
  [...folderPaths].sort((left, right) => left.localeCompare(right)).forEach((path) => insertFolderNode(tree, path, expandedFolders, autoExpandDepth));
  Object.values(files).forEach((file) => insertFileNode(tree, file, expandedFolders, autoExpandDepth));
  sortTree(tree);
  return tree;
}

function isSameOrChildPath(path: string, targetPath: string) {
  return path === targetPath || path.startsWith(`${targetPath}/`);
}

function renamePathPrefix(path: string, fromPath: string, toPath: string) {
  if (path === fromPath) return toPath;
  return `${toPath}/${path.slice(fromPath.length + 1)}`;
}

function buildImportedWorkspace(importedFiles: ImportedWorkspaceFile[]) {
  const nextFiles: Record<string, WorkspaceFile> = {};
  const nextTree: FileNode[] = [];
  const nextExpandedFolders = new Set<string>();
  const importedIds: string[] = [];
  const autoExpandDepth = getImportAutoExpandDepth(importedFiles.length);

  importedFiles.forEach((importedFile) => {
    const path = normalizeImportPath(importedFile.path || importedFile.name);
    if (!path) return;

    const id = importedFileId(path);
    const file: WorkspaceFile = {
      id,
      name: importedFile.name || path.split("/").pop() || "untitled",
      path,
      language: inferLanguageFromPath(path),
      content: importedFile.content,
      originalContent: importedFile.content,
      modified: false,
      assetKind: importedFile.assetKind,
      blobKey: importedFile.blobKey,
      dataUrl: importedFile.dataUrl,
      mimeType: importedFile.mimeType,
      size: importedFile.size
    };

    nextFiles[id] = file;
    insertFileNode(nextTree, file, nextExpandedFolders, autoExpandDepth);
    importedIds.push(id);
  });

  sortTree(nextTree);

  return {
    activeFileId: importedIds[0] ?? null,
    expandedFolders: [...nextExpandedFolders],
    fileTree: nextTree,
    files: nextFiles,
    importedIds,
    largeMode: importedFiles.length >= largeWorkspaceFileCount
  };
}

function getImportAutoExpandDepth(fileCount: number) {
  if (fileCount <= 80) return Number.POSITIVE_INFINITY;
  if (fileCount <= largeWorkspaceFileCount) return 2;
  return 2;
}

function getPersistableWorkspaceSnapshot(state: WorkspaceState) {
  const fileEntries = Object.entries(state.files);
  let totalCharacters = 0;
  let canPersistWorkspace = fileEntries.length <= persistWorkspaceFileLimit;

  if (canPersistWorkspace) {
    for (const [, file] of fileEntries) {
      totalCharacters += file.content.length + file.originalContent.length;
      if (file.dataUrl || file.blobKey || totalCharacters > persistWorkspaceCharacterLimit) {
        canPersistWorkspace = false;
        break;
      }
    }
  }

  if (!canPersistWorkspace) {
    return {
      activeFileId: "file-app",
      expandedFolders: [...initialExpandedFolders],
      fileTree: cloneInitialFileTree(),
      files: cloneInitialFiles(),
      openTabs: ["file-app", "file-style"],
      previewPath: null
    };
  }

  return {
    activeFileId: state.activeFileId,
    expandedFolders: state.expandedFolders.slice(0, persistedExpandedFolderLimit),
    fileTree: state.fileTree,
    files: Object.fromEntries(
      fileEntries.map(([id, file]) => [
        id,
        {
          ...file,
          dataUrl: undefined
        }
      ])
    ),
    openTabs: state.openTabs,
    previewPath: state.previewPath
  };
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activityView: "explorer",
      bottomPanelView: "terminal",
      bottomPanelOpen: true,
      commandPaletteOpen: false,
      commandPaletteQuery: "",
      editorScrollTop: 0,
      enabledExtensionIds: defaultExtensionIds,
      expandedFolders: [...initialExpandedFolders],
      fileTree: cloneInitialFileTree(),
      files: cloneInitialFiles(),
      minimap: true,
      openTabs: ["file-app", "file-style"],
      activeFileId: "file-app",
      pendingEditorAction: null,
      pendingSnippet: null,
      panelHeight: 240,
      previewPath: null,
      searchQuery: "",
      sidebarWidth: 286,
      splitView: false,
      syncScroll: true,
      terminalLog: ["Code Workspace terminal initialized.", "Type help to see available commands."],
      theme: "dark",

      addImportedFiles: (importedFiles, sourceLabel = "local picker") =>
        set((state) => {
          const nextFiles = { ...state.files };
          const nextTree = cloneTree(state.fileTree?.length ? state.fileTree : cloneInitialFileTree());
          const nextExpandedFolders = new Set(state.expandedFolders);
          const importedIds: string[] = [];
          const autoExpandDepth = getImportAutoExpandDepth(importedFiles.length);

          importedFiles.forEach((importedFile) => {
            const path = normalizeImportPath(importedFile.path || importedFile.name);
            if (!path) return;

            const existingFile = Object.values(nextFiles).find((file) => file.path === path);
            const id = existingFile?.id ?? importedFileId(path);
            const file: WorkspaceFile = {
              id,
              name: importedFile.name || path.split("/").pop() || "untitled",
              path,
              language: inferLanguageFromPath(path),
              content: importedFile.content,
              originalContent: importedFile.content,
              modified: false,
              assetKind: importedFile.assetKind,
              blobKey: importedFile.blobKey,
              dataUrl: importedFile.dataUrl,
              mimeType: importedFile.mimeType,
              size: importedFile.size
            };

            nextFiles[id] = file;
            insertFileNode(nextTree, file, nextExpandedFolders, autoExpandDepth);
            importedIds.push(id);
          });

          if (!importedIds.length) return state;

          sortTree(nextTree);

          const activeFileId = importedIds[0];
          const openTabs = [...state.openTabs];
          importedIds.slice(0, 8).forEach((id) => {
            if (!openTabs.includes(id)) openTabs.push(id);
          });

          return {
            activeFileId,
            expandedFolders: [...nextExpandedFolders],
            fileTree: nextTree,
            files: nextFiles,
            openTabs,
            previewPath: state.previewPath,
            terminalLog: [
              ...state.terminalLog,
              `Imported ${importedIds.length} file(s) from ${sourceLabel}.`,
              ...(importedIds.length >= largeWorkspaceFileCount ? ["Large import mode: folders stay collapsed and reload persistence is reduced for speed."] : [])
            ].slice(-120)
          };
        }),

      replaceWorkspaceWithImportedFiles: (importedFiles, sourceLabel = "local folder") =>
        set((state) => {
          const workspace = buildImportedWorkspace(importedFiles);
          if (!workspace.importedIds.length) return state;

          return {
            activeFileId: workspace.activeFileId,
            expandedFolders: workspace.expandedFolders,
            fileTree: workspace.fileTree,
            files: workspace.files,
            openTabs: workspace.importedIds.slice(0, 8),
            previewPath: null,
            searchQuery: "",
            terminalLog: [
              `Opened folder ${sourceLabel}.`,
              `Loaded ${workspace.importedIds.length} file(s).`,
              ...(workspace.largeMode ? ["Large folder mode: folders stay collapsed and reload persistence is reduced for speed."] : [])
            ]
          };
        }),

      addTerminalLines: (lines) =>
        set((state) => ({
          terminalLog: [...state.terminalLog, ...lines].slice(-120)
        })),

      clearTerminal: () => set({ terminalLog: [] }),

      copyPath: (fromPath, toPath) => {
        const state = get();
        const from = normalizeImportPath(fromPath);
        const to = normalizeImportPath(toPath);
        const files = Object.values(state.files);
        const sourceFile = files.find((file) => file.path === from);
        const sourceFiles = files.filter((file) => isSameOrChildPath(file.path, from));

        if (!sourceFile && !sourceFiles.length) return false;

        if (sourceFile) {
          get().createFile(to, sourceFile.content);
          return true;
        }

        set((current) => {
          const nextFiles = { ...current.files };
          const folderPaths = collectFolderPaths(current.fileTree);
          folderPaths.add(to);
          const expandedFolders = new Set(current.expandedFolders);
          const openTabs = [...current.openTabs];

          sourceFiles.forEach((file) => {
            const nextPath = renamePathPrefix(file.path, from, to);
            const id = importedFileId(nextPath);
            nextFiles[id] = {
              ...file,
              id,
              name: nextPath.split("/").pop() || file.name,
              path: nextPath,
              originalContent: file.content,
              modified: false
            };
            if (!openTabs.includes(id) && openTabs.length < 8) openTabs.push(id);
          });

          return {
            files: nextFiles,
            fileTree: rebuildTree(nextFiles, folderPaths, expandedFolders),
            expandedFolders: [...expandedFolders],
            openTabs
          };
        });
        return true;
      },

      createFile: (path, content = "") =>
        set((state) => {
          const normalizedPath = normalizeImportPath(path);
          if (!normalizedPath) return state;

          const existingFile = Object.values(state.files).find((file) => file.path === normalizedPath);
          const id = existingFile?.id ?? importedFileId(normalizedPath);
          const nextFiles = {
            ...state.files,
            [id]: {
              id,
              name: normalizedPath.split("/").pop() || "untitled",
              path: normalizedPath,
              language: inferLanguageFromPath(normalizedPath),
              content,
              originalContent: content,
              modified: false
            }
          };
          const folderPaths = collectFolderPaths(state.fileTree);
          const parent = normalizedPath.split("/").slice(0, -1).join("/");
          if (parent) folderPaths.add(parent);
          const expandedFolders = new Set(state.expandedFolders);

          return {
            activeFileId: id,
            files: nextFiles,
            fileTree: rebuildTree(nextFiles, folderPaths, expandedFolders),
            expandedFolders: [...expandedFolders],
            openTabs: state.openTabs.includes(id) ? state.openTabs : [...state.openTabs, id]
          };
        }),

      createFolder: (path) =>
        set((state) => {
          const normalizedPath = normalizeImportPath(path);
          if (!normalizedPath) return state;

          const folderPaths = collectFolderPaths(state.fileTree);
          folderPaths.add(normalizedPath);
          const expandedFolders = new Set(state.expandedFolders);

          return {
            fileTree: rebuildTree(state.files, folderPaths, expandedFolders),
            expandedFolders: [...expandedFolders]
          };
        }),

      closeCommandPalette: () => set({ commandPaletteOpen: false, commandPaletteQuery: "" }),

      closeTab: (fileId) =>
        set((state) => ({
          openTabs: state.openTabs.filter((id) => id !== fileId),
          activeFileId: selectNextTab(state.openTabs, fileId, state.activeFileId)
        })),

      consumeEditorAction: () => {
        const action = get().pendingEditorAction;
        set({ pendingEditorAction: null });
        return action;
      },

      consumeSnippet: () => {
        const snippet = get().pendingSnippet;
        set({ pendingSnippet: null });
        return snippet;
      },

      cycleTheme: () =>
        set((state) => {
          const order: WorkspaceTheme[] = ["dark", "light", "contrast"];
          const next = order[(order.indexOf(state.theme) + 1) % order.length];
          return { theme: next };
        }),

      deletePath: (path) => {
        const normalizedPath = normalizeImportPath(path);
        const state = get();
        const filesToDelete = Object.values(state.files).filter((file) => isSameOrChildPath(file.path, normalizedPath));
        const folders = collectFolderPaths(state.fileTree);
        const hasFolder = folders.has(normalizedPath);

        if (!filesToDelete.length && !hasFolder) return false;

        set((current) => {
          const nextFiles = Object.fromEntries(
            Object.entries(current.files).filter(([, file]) => !isSameOrChildPath(file.path, normalizedPath))
          );
          const folderPaths = collectFolderPaths(current.fileTree);
          [...folderPaths].forEach((folderPath) => {
            if (isSameOrChildPath(folderPath, normalizedPath)) folderPaths.delete(folderPath);
          });
          const expandedFolders = new Set(current.expandedFolders);
          const deletedIds = new Set(filesToDelete.map((file) => file.id));
          const openTabs = current.openTabs.filter((id) => !deletedIds.has(id));

          return {
            activeFileId: current.activeFileId && deletedIds.has(current.activeFileId) ? openTabs[0] ?? null : current.activeFileId,
            files: nextFiles,
            fileTree: rebuildTree(nextFiles, folderPaths, expandedFolders),
            expandedFolders: [...expandedFolders],
            openTabs,
            previewPath: current.previewPath && isSameOrChildPath(current.previewPath, normalizedPath) ? null : current.previewPath
          };
        });
        return true;
      },

      movePath: (fromPath, toPath) => {
        const from = normalizeImportPath(fromPath);
        const to = normalizeImportPath(toPath);
        const state = get();
        const sourceFiles = Object.values(state.files).filter((file) => isSameOrChildPath(file.path, from));
        const folderPaths = collectFolderPaths(state.fileTree);
        const hasFolder = folderPaths.has(from);

        if (!sourceFiles.length && !hasFolder) return false;

        set((current) => {
          const nextFiles = { ...current.files };
          const movedIdMap = new Map<string, string>();

          sourceFiles.forEach((file) => {
            delete nextFiles[file.id];
            const nextPath = renamePathPrefix(file.path, from, to);
            const id = importedFileId(nextPath);
            movedIdMap.set(file.id, id);
            nextFiles[id] = {
              ...file,
              id,
              name: nextPath.split("/").pop() || file.name,
              path: nextPath,
              language: inferLanguageFromPath(nextPath)
            };
          });

          const nextFolderPaths = collectFolderPaths(current.fileTree);
          [...nextFolderPaths].forEach((folderPath) => {
            if (isSameOrChildPath(folderPath, from)) {
              nextFolderPaths.delete(folderPath);
              nextFolderPaths.add(renamePathPrefix(folderPath, from, to));
            }
          });
          if (hasFolder) nextFolderPaths.add(to);

          const expandedFolders = new Set(current.expandedFolders);
          const openTabs = current.openTabs.map((id) => movedIdMap.get(id) ?? id);

          return {
            activeFileId: current.activeFileId ? movedIdMap.get(current.activeFileId) ?? current.activeFileId : null,
            files: nextFiles,
            fileTree: rebuildTree(nextFiles, nextFolderPaths, expandedFolders),
            expandedFolders: [...expandedFolders],
            openTabs,
            previewPath: current.previewPath && isSameOrChildPath(current.previewPath, from) ? renamePathPrefix(current.previewPath, from, to) : current.previewPath
          };
        });
        return true;
      },

      openCommandPalette: (query = "") => set({ commandPaletteOpen: true, commandPaletteQuery: query }),

      openFile: (fileId) =>
        set((state) => {
          if (!state.files[fileId]) return state;
          return {
            activeFileId: fileId,
            openTabs: state.openTabs.includes(fileId) ? state.openTabs : [...state.openTabs, fileId]
          };
        }),

      openFileByPath: (path) => {
        const file = Object.values(get().files).find((entry) => entry.path === path);
        if (!file) return false;
        get().openFile(file.id);
        return true;
      },

      queueEditorAction: (actionId) => set({ pendingEditorAction: actionId }),

      queueSnippet: (body) => set({ pendingSnippet: body }),

      resetWorkspace: () =>
        set({
          files: cloneInitialFiles(),
          fileTree: cloneInitialFileTree(),
          openTabs: ["file-app", "file-style"],
          activeFileId: "file-app",
          expandedFolders: [...initialExpandedFolders],
          previewPath: null,
          terminalLog: ["Workspace reset to the bundled demo project."]
        }),

      saveActiveFile: () =>
        set((state) => {
          if (!state.activeFileId) return state;
          const file = state.files[state.activeFileId];
          if (!file) return state;
          return {
            files: {
              ...state.files,
              [file.id]: {
                ...file,
                originalContent: file.content,
                modified: false
              }
            },
            terminalLog: [...state.terminalLog, `Saved ${file.path}.`].slice(-120)
          };
        }),

      saveAllFiles: () =>
        set((state) => ({
          files: Object.fromEntries(
            Object.entries(state.files).map(([id, file]) => [
              id,
              {
                ...file,
                originalContent: file.content,
                modified: false
              }
            ])
          ),
          terminalLog: [...state.terminalLog, "Saved all modified files."].slice(-120)
        })),

      setActivityView: (view) => set({ activityView: view }),
      setActiveFile: (fileId) => get().openFile(fileId),
      setBottomPanelView: (view) => set({ bottomPanelView: view, bottomPanelOpen: true }),
      setCommandPaletteQuery: (query) => set({ commandPaletteQuery: query }),
      setEditorScrollTop: (scrollTop) => set({ editorScrollTop: scrollTop }),
      setPanelHeight: (height) => set({ panelHeight: Math.max(148, Math.min(420, height)) }),
      setPreviewPath: (path) => set({ previewPath: path }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(220, Math.min(420, width)) }),
      setTheme: (theme) => set({ theme }),

      toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),

      toggleExtension: (extensionId) =>
        set((state) => ({
          enabledExtensionIds: state.enabledExtensionIds.includes(extensionId)
            ? state.enabledExtensionIds.filter((id) => id !== extensionId)
            : [...state.enabledExtensionIds, extensionId]
        })),

      toggleFolder: (folderId) =>
        set((state) => ({
          expandedFolders: state.expandedFolders.includes(folderId)
            ? state.expandedFolders.filter((id) => id !== folderId)
            : [...state.expandedFolders, folderId]
        })),

      toggleMinimap: () => set((state) => ({ minimap: !state.minimap })),
      toggleSplitView: () => set((state) => ({ splitView: !state.splitView })),
      toggleSyncScroll: () => set((state) => ({ syncScroll: !state.syncScroll })),

      updateFileContent: (fileId, content) =>
        set((state) => {
          const file = state.files[fileId];
          if (!file) return state;
          return {
            files: {
              ...state.files,
              [fileId]: {
                ...file,
                content,
                modified: content !== file.originalContent
              }
            }
          };
        })
    }),
    {
      name: "code-workspace-state-v2",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => () => {
        try {
          localStorage.removeItem("code-workspace-state");
        } catch {
          // Browsers can block storage access in private modes; the app still works in memory.
        }
      },
      partialize: (state) => ({
        ...getPersistableWorkspaceSnapshot(state),
        bottomPanelOpen: state.bottomPanelOpen,
        bottomPanelView: state.bottomPanelView,
        enabledExtensionIds: state.enabledExtensionIds,
        minimap: state.minimap,
        panelHeight: state.panelHeight,
        sidebarWidth: state.sidebarWidth,
        splitView: state.splitView,
        syncScroll: state.syncScroll,
        theme: state.theme
      })
    }
  )
);
