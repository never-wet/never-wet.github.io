"use client";

import { useMemo } from "react";

import type { WorkspaceExtension } from "@/lib/types";
import { flattenFiles, simulateRun } from "@/lib/workspace-utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

function SnippetPanel({ extensionId }: { extensionId: string }) {
  const queueSnippet = useWorkspaceStore((state) => state.queueSnippet);
  const snippets = useMemo(
    () => [
      {
        label: "React component",
        body: `interface CardProps {
  title: string;
  body: string;
}

export function Card({ title, body }: CardProps) {
  return (
    <article className="card">
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}
`
      },
      {
        label: "Async loader",
        body: `export async function loadWorkspace() {
  const response = await fetch("/api/workspace");
  if (!response.ok) {
    throw new Error("Workspace failed to load");
  }
  return response.json();
}
`
      }
    ],
    []
  );

  return (
    <div className="extension-panel" data-extension={extensionId}>
      <p className="panel-copy">Snippet Pack contributes reusable code blocks to completion and commands.</p>
      <div className="stack">
        {snippets.map((snippet) => (
          <button className="secondary-button" key={snippet.label} onClick={() => queueSnippet(snippet.body)} type="button">
            Insert {snippet.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({ extensionId }: { extensionId: string }) {
  const activeFileId = useWorkspaceStore((state) => state.activeFileId);
  const files = useWorkspaceStore((state) => state.files);
  const file = activeFileId ? files[activeFileId] : undefined;
  const output = simulateRun(file);

  return (
    <div className="extension-panel" data-extension={extensionId}>
      <p className="panel-copy">Preview Runner exposes a lightweight run target for the active file.</p>
      <pre className="mini-terminal">{output.slice(0, 4).join("\n")}</pre>
    </div>
  );
}

function GitPanel({ extensionId }: { extensionId: string }) {
  const files = useWorkspaceStore((state) => state.files);
  const changedFiles = Object.values(files).filter((file) => file.modified);

  return (
    <div className="extension-panel" data-extension={extensionId}>
      <p className="panel-copy">Git Insights adds workspace change summaries and source-control commands.</p>
      <div className="metric-row">
        <span>{changedFiles.length}</span>
        <strong>modified files</strong>
      </div>
      {changedFiles.slice(0, 4).map((file) => (
        <div className="change-chip" key={file.id}>
          M {file.path}
        </div>
      ))}
    </div>
  );
}

function ThemePanel({ extensionId }: { extensionId: string }) {
  const theme = useWorkspaceStore((state) => state.theme);
  const setTheme = useWorkspaceStore((state) => state.setTheme);

  return (
    <div className="extension-panel" data-extension={extensionId}>
      <p className="panel-copy">Theme Lab contributes workbench themes and status bar decorations.</p>
      <div className="segmented">
        {(["dark", "light", "contrast"] as const).map((item) => (
          <button className={theme === item ? "active" : ""} key={item} onClick={() => setTheme(item)} type="button">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export const builtinExtensions: WorkspaceExtension[] = [
  {
    id: "workspace-snippets",
    displayName: "Workspace Snippets",
    publisher: "Never Wet",
    description: "Adds TypeScript, React, and CSS snippets to the editor and command palette.",
    activationEvent: "onStartupFinished",
    activate(api) {
      api.registerSnippet({
        id: "snippet-react-component",
        label: "React component",
        language: "typescript",
        detail: "Functional component with typed props",
        body: `interface Props {
  title: string;
}

export function Feature({ title }: Props) {
  return <section>{title}</section>;
}
`
      });
      api.registerSnippet({
        id: "snippet-zustand-slice",
        label: "Zustand slice",
        language: "typescript",
        detail: "Small Zustand action slice",
        body: `interface SliceState {
  value: string;
  setValue: (value: string) => void;
}

export const createSlice = (set: (state: Partial<SliceState>) => void): SliceState => ({
  value: "",
  setValue: (value) => set({ value })
});
`
      });
      api.registerCommand({
        id: "snippets.insertReactComponent",
        title: "Insert React Component Snippet",
        category: "Snippets",
        keywords: ["react", "component", "snippet"],
        run: () =>
          useWorkspaceStore.getState().queueSnippet(`interface Props {
  title: string;
}

export function Feature({ title }: Props) {
  return <section>{title}</section>;
}
`)
      });
      api.registerPanel({
        id: "workspace-snippets.panel",
        title: "Snippet Pack",
        Component: SnippetPanel
      });
      api.decorateStatusBar({ id: "snippets", label: "Snippets: 2", tone: "accent" });
    }
  },
  {
    id: "preview-runner",
    displayName: "Preview Runner",
    publisher: "Never Wet",
    description: "Adds run commands and a preview output panel for the active file.",
    activationEvent: "onCommand:workspace.runActiveFile",
    activate(api) {
      api.registerCommand({
        id: "workspace.runActiveFile.extension",
        title: "Run Active File",
        category: "Run",
        keybinding: "Ctrl+Enter",
        keywords: ["preview", "terminal", "run"],
        run: () => {
          const state = useWorkspaceStore.getState();
          const file = state.activeFileId ? state.files[state.activeFileId] : undefined;
          if (file && (file.language === "html" || /\.html?$/i.test(file.path))) {
            state.setPreviewPath(file.path);
            state.setBottomPanelView("preview");
            const result = requestPreviewTab(file.path);
            state.addTerminalLines([`Serving ${file.path}`, "Local URL: http://localhost:5173/", getPreviewOpenMessage(result)]);
            return;
          }

          state.setBottomPanelView("terminal");
          state.addTerminalLines(simulateRun(file));
        }
      });
      api.registerCommand({
        id: "workspace.openPackage",
        title: "Open package.json",
        category: "Workspace",
        keywords: ["package", "file"],
        run: () => useWorkspaceStore.getState().openFileByPath("package.json")
      });
      api.registerPanel({
        id: "preview-runner.panel",
        title: "Preview Runner",
        Component: PreviewPanel
      });
      api.decorateStatusBar({ id: "preview", label: "Preview ready", tone: "success" });
    }
  },
  {
    id: "git-insights",
    displayName: "Git Insights",
    publisher: "Never Wet",
    description: "Adds source-control summaries, status decorations, and simulated commit commands.",
    activationEvent: "onView:source-control",
    activate(api) {
      api.registerCommand({
        id: "git.status",
        title: "Git: Show Status",
        category: "Source Control",
        keywords: ["git", "changes", "status"],
        run: () => {
          const files = flattenFiles(useWorkspaceStore.getState().files);
          const changed = files.filter((file) => file.modified);
          useWorkspaceStore.getState().setBottomPanelView("terminal");
          useWorkspaceStore
            .getState()
            .addTerminalLines(changed.length ? changed.map((file) => `M  ${file.path}`) : ["Working tree clean."]);
        }
      });
      api.registerCommand({
        id: "git.saveAll",
        title: "Git: Stage All Changes",
        category: "Source Control",
        keywords: ["git", "stage", "save"],
        run: () => {
          const state = useWorkspaceStore.getState();
          state.saveAllFiles();
          state.addTerminalLines(["Staged all workspace changes in the simulated index."]);
        }
      });
      api.registerPanel({
        id: "git-insights.panel",
        title: "Git Insights",
        Component: GitPanel
      });
      api.decorateStatusBar({ id: "branch", label: "main*", tone: "warning" });
    }
  },
  {
    id: "theme-lab",
    displayName: "Theme Lab",
    publisher: "Never Wet",
    description: "Adds theme switching commands and workbench color controls.",
    activationEvent: "onStartupFinished",
    activate(api) {
      api.registerCommand({
        id: "theme.cycle",
        title: "Theme: Cycle Theme",
        category: "Preferences",
        keybinding: "Ctrl+K Ctrl+T",
        keywords: ["theme", "appearance", "color"],
        run: () => useWorkspaceStore.getState().cycleTheme()
      });
      api.registerCommand({
        id: "settings.open",
        title: "Preferences: Open Settings",
        category: "Preferences",
        keywords: ["settings", "preferences", "customize"],
        run: () => useWorkspaceStore.getState().setActivityView("settings")
      });
      api.registerPanel({
        id: "theme-lab.panel",
        title: "Theme Lab",
        Component: ThemePanel
      });
    }
  }
];

type PreviewTabOpenResult = "opened" | "blocked" | "missing";

interface PreviewTabEventDetail {
  path?: string | null;
  result?: PreviewTabOpenResult;
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
