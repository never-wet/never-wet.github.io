"use client";

/* eslint-disable @next/next/no-img-element */

import Editor, { loader } from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { editor as MonacoEditor, IDisposable } from "monaco-editor";

import { getCachedAssetBlob } from "@/lib/blob-cache";
import type { SnippetContribution, WorkspaceFile, WorkspaceTheme } from "@/lib/types";
import { normalizeImportPath } from "@/lib/workspace-utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"
  }
});

interface EditorPaneProps {
  paneId: "primary" | "secondary";
  readOnly?: boolean;
  snippets: SnippetContribution[];
}

const themeMap: Record<WorkspaceTheme, string> = {
  dark: "codeWorkspaceDark",
  light: "codeWorkspaceLight",
  contrast: "codeWorkspaceContrast"
};

let completionsRegistered = false;

export function EditorPane({ paneId, readOnly = false, snippets }: EditorPaneProps) {
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const minimap = useWorkspaceStore((state) => state.minimap);
  const theme = useWorkspaceStore((state) => state.theme);
  const syncScroll = useWorkspaceStore((state) => state.syncScroll);
  const editorScrollTop = useWorkspaceStore((state) => state.editorScrollTop);
  const updateFileContent = useWorkspaceStore((state) => state.updateFileContent);
  const setEditorScrollTop = useWorkspaceStore((state) => state.setEditorScrollTop);
  const saveActiveFile = useWorkspaceStore((state) => state.saveActiveFile);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const disposables = useRef<IDisposable[]>([]);
  const syncRef = useRef(syncScroll);
  const readOnlyRef = useRef(readOnly);
  const lastAppliedScroll = useRef(0);
  const file = activeFileId ? files[activeFileId] : undefined;

  const options = useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(
    () => ({
      automaticLayout: true,
      autoIndent: "full",
      bracketPairColorization: { enabled: true },
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace",
      fontLigatures: true,
      fontSize: 14,
      formatOnPaste: true,
      formatOnType: true,
      lineNumbers: "on",
      matchBrackets: "always",
      minimap: { enabled: minimap, scale: 0.78, showSlider: "mouseover" },
      multiCursorModifier: "ctrlCmd",
      padding: { top: 12, bottom: 18 },
      readOnly,
      renderLineHighlight: "all",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: 2,
      wordWrap: "on"
    }),
    [minimap, readOnly]
  );

  useEffect(() => {
    syncRef.current = syncScroll;
  }, [syncScroll]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !readOnly || !syncScroll) return;
    if (Math.abs(lastAppliedScroll.current - editorScrollTop) < 2) return;
    lastAppliedScroll.current = editorScrollTop;
    editor.setScrollTop(editorScrollTop);
  }, [editorScrollTop, readOnly, syncScroll]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.setTheme(themeMap[theme]);
  }, [theme]);

  useEffect(() => {
    if (paneId !== "primary") return;
    const interval = window.setInterval(() => {
      const store = useWorkspaceStore.getState();
      const snippet = store.consumeSnippet();
      if (snippet && editorRef.current && !readOnlyRef.current) {
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        const range = selection ?? model?.getFullModelRange();
        if (!range) return;
        editor.executeEdits("snippet", [
          {
            range,
            text: snippet,
            forceMoveMarkers: true
          }
        ]);
        editor.focus();
      }

      const actionId = store.consumeEditorAction();
      if (actionId && editorRef.current) {
        editorRef.current.getAction(actionId)?.run();
        editorRef.current.focus();
      }
    }, 120);

    return () => window.clearInterval(interval);
  }, [paneId]);

  if (!file) return null;

  if (file.assetKind) {
    return (
      <div className="editor-pane" data-pane={paneId}>
        {readOnly && <div className="split-label">Read-only synced split</div>}
        <AssetPreview file={file} key={file.id} />
      </div>
    );
  }

  return (
    <div className="editor-pane" data-pane={paneId}>
      {readOnly && <div className="split-label">Read-only synced split</div>}
      <Editor
        beforeMount={(monaco) => {
          defineThemes(monaco);
          registerCompletions(monaco, snippets, disposables.current);
        }}
        height="100%"
        language={file.language}
        onChange={(value) => {
          if (!readOnly) updateFileContent(file.id, value ?? "");
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco;
          monaco.editor.setTheme(themeMap[theme]);
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveActiveFile());
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            const store = useWorkspaceStore.getState();
            const active = store.activeFileId ? store.files[store.activeFileId] : undefined;
            store.setBottomPanelView("terminal");
            store.addTerminalLines([`Running ${active?.path ?? "workspace"} from editor shortcut...`]);
          });
          disposables.current.push(
            editor.onDidScrollChange((event) => {
              if (!syncRef.current || readOnlyRef.current) return;
              lastAppliedScroll.current = event.scrollTop;
              setEditorScrollTop(event.scrollTop);
            })
          );
          disposables.current.push(editor.onMouseDown((event) => handleCtrlClickLink(editor, event)));
        }}
        options={options}
        path={file.path}
        theme={themeMap[theme]}
        value={file.content}
      />
    </div>
  );
}

function handleCtrlClickLink(editor: MonacoEditor.IStandaloneCodeEditor, event: MonacoEditor.IEditorMouseEvent) {
  if (!(event.event.ctrlKey || event.event.metaKey) || !event.target.position) return;

  const model = editor.getModel();
  if (!model) return;

  const line = model.getLineContent(event.target.position.lineNumber);
  const column = event.target.position.column;
  const link = findLinkAtColumn(line, column);
  if (!link) return;

  event.event.preventDefault();
  event.event.stopPropagation();

  if (/^https?:\/\//i.test(link)) {
    window.open(link, "_blank", "noopener,noreferrer");
    return;
  }

  const store = useWorkspaceStore.getState();
  const active = store.activeFileId ? store.files[store.activeFileId] : undefined;
  const candidates = getPathCandidates(link, active?.path);
  const opened = candidates.some((candidate) => store.openFileByPath(candidate));

  if (!opened) {
    store.setBottomPanelView("terminal");
    store.addTerminalLines([`Link target not found: ${link}`]);
  }
}

function findLinkAtColumn(line: string, column: number) {
  const index = Math.max(0, column - 1);
  const patterns = [
    /https?:\/\/[^\s"'`<>()\[\]{}]+/gi,
    /(?:\.{1,2}\/|\/)?[\w@~.-]+(?:\/[\w@~.-]+)+(?:\.[a-z0-9]+)?(?::\d+)?/gi,
    /[\w@~.-]+\.(?:tsx?|jsx?|css|scss|sass|html?|jsonc?|mdx?|ya?ml|toml|svg|png|jpe?g|gif|webp|mp4|webm|mov|mp3|wav|pdf)(?::\d+)?/gi
  ];

  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (index >= start && index <= end) {
        return cleanLinkToken(match[0]);
      }
    }
  }

  return "";
}

function cleanLinkToken(token: string) {
  return token.replace(/[),.;\]]+$/g, "").replace(/^["'`]+|["'`]+$/g, "");
}

function getPathCandidates(rawPath: string, activePath?: string) {
  const withoutLine = rawPath.replace(/:\d+$/, "");
  const normalized = normalizeImportPath(withoutLine.replace(/^file:\/\//i, ""));
  const activeDir = activePath?.includes("/") ? activePath.split("/").slice(0, -1).join("/") : "";
  const candidates = new Set<string>();

  candidates.add(normalizeRelativePath("", normalized));
  if (activeDir) candidates.add(normalizeRelativePath(activeDir, normalized));
  candidates.add(normalized.replace(/^\.\//, ""));
  candidates.add(normalized.replace(/^\/+/, ""));

  return [...candidates].filter(Boolean);
}

function normalizeRelativePath(baseDir: string, path: string) {
  const absolute = path.startsWith("/") ? path.slice(1) : baseDir ? `${baseDir}/${path}` : path;
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

function AssetPreview({ file }: { file: WorkspaceFile }) {
  const [cachedPreviewUrl, setCachedPreviewUrl] = useState("");
  const directPreviewUrl = getAssetPreviewUrl(file);
  const previewUrl = directPreviewUrl || cachedPreviewUrl;
  const details = [
    file.mimeType || "unknown type",
    file.size ? formatBytes(file.size) : "unknown size",
    file.path
  ];

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    if (directPreviewUrl || !file.blobKey || file.assetKind === "binary") return;

    getCachedAssetBlob(file.blobKey)
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setCachedPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setCachedPreviewUrl("");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [directPreviewUrl, file.assetKind, file.blobKey]);

  return (
    <div className={`asset-preview ${file.assetKind === "svg" ? "asset-preview--svg" : "asset-preview--media"}`}>
      <header className="asset-preview__header">
        <span>{file.assetKind}</span>
        <strong>{file.name}</strong>
        <small>{details.join(" / ")}</small>
      </header>

      <div className="asset-preview__stage">
        {file.assetKind === "image" && previewUrl && <img alt={file.name} src={previewUrl} />}
        {file.assetKind === "svg" && previewUrl && <img alt={file.name} src={previewUrl} />}
        {file.assetKind === "video" && previewUrl && <video controls src={previewUrl} />}
        {file.assetKind === "audio" && previewUrl && <audio controls src={previewUrl} />}
        {(!previewUrl || file.assetKind === "binary") && (
          <div className="asset-preview__empty">
            <strong>Preview unavailable</strong>
            <p>{file.content}</p>
          </div>
        )}
      </div>

      {file.assetKind === "svg" && (
        <pre className="asset-preview__source">
          {file.content}
        </pre>
      )}
    </div>
  );
}

function getAssetPreviewUrl(file: WorkspaceFile) {
  if (file.dataUrl) return file.dataUrl;
  if (file.assetKind === "svg" && file.content.trim()) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(file.content)}`;
  }
  return "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function defineThemes(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("codeWorkspaceDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7d8590" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" }
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#d4d4d4",
      "editorLineNumber.foreground": "#6e7681",
      "editorCursor.foreground": "#58a6ff",
      "editor.selectionBackground": "#264f78",
      "editor.lineHighlightBackground": "#2a2d2e"
    }
  });

  monaco.editor.defineTheme("codeWorkspaceLight", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a737d" },
      { token: "keyword", foreground: "d73a49" },
      { token: "string", foreground: "032f62" }
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#24292f",
      "editorLineNumber.foreground": "#8c959f",
      "editorCursor.foreground": "#0969da",
      "editor.selectionBackground": "#bfdbfe",
      "editor.lineHighlightBackground": "#f6f8fa"
    }
  });

  monaco.editor.defineTheme("codeWorkspaceContrast", {
    base: "hc-black",
    inherit: true,
    rules: [
      { token: "comment", foreground: "9da7b3" },
      { token: "keyword", foreground: "ffcc00" },
      { token: "string", foreground: "70ffb5" }
    ],
    colors: {
      "editor.background": "#050505",
      "editor.foreground": "#ffffff",
      "editorCursor.foreground": "#ffcc00",
      "editor.selectionBackground": "#375a7f",
      "editor.lineHighlightBackground": "#171717"
    }
  });
}

function registerCompletions(
  monaco: typeof import("monaco-editor"),
  snippets: SnippetContribution[],
  disposables: IDisposable[]
) {
  if (completionsRegistered) return;
  completionsRegistered = true;

  const editorLanguages = ["typescript", "javascript", "css", "json", "markdown"];
  editorLanguages.forEach((language) => {
    const disposable = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: [".", "<", ":", " "],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const baseSuggestions = [
          {
            label: "workspace.command",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "workspace.command(\"${1:build}\")",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Code Workspace command API",
            range
          },
          {
            label: "extension.registerCommand",
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: "api.registerCommand({\n  id: \"${1:extension.command}\",\n  title: \"${2:Command Title}\",\n  category: \"${3:Extension}\",\n  run: () => {\n    ${4:// command body}\n  }\n});",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Extension API command contribution",
            range
          }
        ];

        const snippetSuggestions = snippets
          .filter((snippet) => snippet.language === language || language === "typescript")
          .map((snippet) => ({
            label: snippet.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: snippet.body,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: snippet.detail,
            range
          }));

        return { suggestions: [...baseSuggestions, ...snippetSuggestions] };
      }
    });
    disposables.push(disposable);
  });
}
