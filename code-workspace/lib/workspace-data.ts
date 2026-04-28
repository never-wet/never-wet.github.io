import type { FileNode, WorkspaceFile } from "@/lib/types";

const files = [
  {
    id: "file-package",
    name: "package.json",
    path: "package.json",
    language: "json",
    content: `{
  "name": "aurora-workbench",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
`
  },
  {
    id: "file-readme",
    name: "README.md",
    path: "README.md",
    language: "markdown",
    content: `# Aurora Workbench

A small in-browser project used to demonstrate the workspace:

- edit files with Monaco
- open multiple tabs
- run simulated commands
- toggle themes, panels, minimap, split view, and keybindings
- install extensions that add commands, snippets, and panels

Try opening the command palette with Ctrl+P or Cmd+P.
`
  },
  {
    id: "file-main",
    name: "main.tsx",
    path: "src/main.tsx",
    language: "typescript",
    content: `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
  },
  {
    id: "file-app",
    name: "App.tsx",
    path: "src/App.tsx",
    language: "typescript",
    content: `import { CommandButton } from "../components/CommandButton";
import { add, formatBuildTime } from "./lib/math";

const panels = ["Explorer", "Search", "Source Control", "Terminal"];

export function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Aurora Workbench</p>
        <h1>Fast local tools for focused development.</h1>
        <p>
          The demo project mirrors the way a real workspace keeps files,
          commands, preview output, and editor settings in one place.
        </p>
        <CommandButton label="Run build" />
      </section>

      <section className="panel-grid" aria-label="Workspace panels">
        {panels.map((panel, index) => (
          <article className="panel" key={panel}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{panel}</strong>
          </article>
        ))}
      </section>

      <footer>
        Build score: {add(21, 21)} / Last run: {formatBuildTime(new Date())}
      </footer>
    </main>
  );
}
`
  },
  {
    id: "file-button",
    name: "CommandButton.tsx",
    path: "components/CommandButton.tsx",
    language: "typescript",
    content: `interface CommandButtonProps {
  label: string;
}

export function CommandButton({ label }: CommandButtonProps) {
  return (
    <button className="command-button" type="button">
      {label}
    </button>
  );
}
`
  },
  {
    id: "file-math",
    name: "math.ts",
    path: "src/lib/math.ts",
    language: "typescript",
    content: `export function add(left: number, right: number) {
  return left + right;
}

export function formatBuildTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}
`
  },
  {
    id: "file-style",
    name: "styles.css",
    path: "src/styles.css",
    language: "css",
    content: `:root {
  color: #f5f5f5;
  background: #161616;
  font-family: Inter, system-ui, sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  align-content: center;
  gap: 28px;
  padding: 48px;
}

.eyebrow {
  color: #4aa3ff;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero {
  max-width: 760px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 6rem);
  line-height: 0.96;
}

.hero p {
  color: #bdbdbd;
  font-size: 1.08rem;
}

.command-button {
  min-height: 40px;
  border: 1px solid #4aa3ff;
  border-radius: 6px;
  background: #4aa3ff;
  color: #06101f;
  font-weight: 800;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.panel {
  min-height: 140px;
  border: 1px solid #343434;
  border-radius: 6px;
  padding: 16px;
}
`
  },
  {
    id: "file-test",
    name: "math.test.ts",
    path: "tests/math.test.ts",
    language: "typescript",
    content: `import { describe, expect, it } from "vitest";
import { add } from "../src/lib/math";

describe("math helpers", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
`
  },
  {
    id: "file-settings",
    name: "settings.json",
    path: ".vscode/settings.json",
    language: "json",
    content: `{
  "editor.fontSize": 14,
  "editor.minimap.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "workbench.colorTheme": "Code Workspace Dark",
  "terminal.integrated.defaultProfile": "Simulated Shell"
}
`
  }
] satisfies Array<Omit<WorkspaceFile, "originalContent" | "modified">>;

export const initialFiles: Record<string, WorkspaceFile> = Object.fromEntries(
  files.map((file) => [
    file.id,
    {
      ...file,
      originalContent: file.content,
      modified: false
    }
  ])
);

export const initialFileTree: FileNode[] = [
  {
    id: "folder-root",
    name: "aurora-workbench",
    path: "",
    type: "folder",
    children: [
      { id: "file-package", name: "package.json", path: "package.json", type: "file", language: "json" },
      { id: "file-readme", name: "README.md", path: "README.md", type: "file", language: "markdown" },
      {
        id: "folder-src",
        name: "src",
        path: "src",
        type: "folder",
        children: [
          { id: "file-main", name: "main.tsx", path: "src/main.tsx", type: "file", language: "typescript" },
          { id: "file-app", name: "App.tsx", path: "src/App.tsx", type: "file", language: "typescript" },
          {
            id: "folder-src-lib",
            name: "lib",
            path: "src/lib",
            type: "folder",
            children: [
              { id: "file-math", name: "math.ts", path: "src/lib/math.ts", type: "file", language: "typescript" }
            ]
          },
          { id: "file-style", name: "styles.css", path: "src/styles.css", type: "file", language: "css" }
        ]
      },
      {
        id: "folder-components",
        name: "components",
        path: "components",
        type: "folder",
        children: [
          {
            id: "file-button",
            name: "CommandButton.tsx",
            path: "components/CommandButton.tsx",
            type: "file",
            language: "typescript"
          }
        ]
      },
      {
        id: "folder-tests",
        name: "tests",
        path: "tests",
        type: "folder",
        children: [{ id: "file-test", name: "math.test.ts", path: "tests/math.test.ts", type: "file", language: "typescript" }]
      },
      {
        id: "folder-vscode",
        name: ".vscode",
        path: ".vscode",
        type: "folder",
        children: [
          {
            id: "file-settings",
            name: "settings.json",
            path: ".vscode/settings.json",
            type: "file",
            language: "json"
          }
        ]
      }
    ]
  }
];

export const initialExpandedFolders = [
  "folder-root",
  "folder-src",
  "folder-src-lib",
  "folder-components",
  "folder-tests",
  "folder-vscode"
];

export function cloneInitialFiles() {
  return Object.fromEntries(Object.entries(initialFiles).map(([id, file]) => [id, { ...file }]));
}

export function cloneInitialFileTree(): FileNode[] {
  return initialFileTree.map(cloneFileNode);
}

function cloneFileNode(node: FileNode): FileNode {
  return {
    ...node,
    children: node.children?.map(cloneFileNode)
  };
}
