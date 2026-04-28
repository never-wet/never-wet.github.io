import type { FileNode, WorkspaceFile } from "@/lib/types";

export function flattenTree(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenTree(node.children) : [])]);
}

export function flattenFiles(files: Record<string, WorkspaceFile>) {
  return Object.values(files).sort((left, right) => left.path.localeCompare(right.path));
}

export function getLanguageLabel(language: string) {
  const labels: Record<string, string> = {
    asset: "Asset",
    bat: "Batch",
    csharp: "C#",
    cpp: "C++",
    css: "CSS",
    dockerfile: "Dockerfile",
    go: "Go",
    html: "HTML",
    java: "Java",
    json: "JSON",
    markdown: "Markdown",
    plaintext: "Plain Text",
    python: "Python",
    rust: "Rust",
    shell: "Shell",
    sql: "SQL",
    toml: "TOML",
    typescript: "TypeScript",
    javascript: "JavaScript",
    xml: "XML",
    yaml: "YAML"
  };
  return labels[language] ?? language;
}

export function inferLanguageFromPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "javascript";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".scss") || lower.endsWith(".sass") || lower.endsWith(".less")) return "css";
  if (lower.endsWith(".json") || lower.endsWith(".jsonc")) return "json";
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) return "markdown";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "html";
  if (lower.endsWith(".svg") || lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".cs")) return "csharp";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx") || lower.endsWith(".c") || lower.endsWith(".h") || lower.endsWith(".hpp")) return "cpp";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  if (lower.endsWith(".toml")) return "toml";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".sh") || lower.endsWith(".bash") || lower.endsWith(".zsh") || lower.endsWith(".ps1")) return "shell";
  if (lower.endsWith(".bat") || lower.endsWith(".cmd")) return "bat";
  if (lower.endsWith("dockerfile") || lower.endsWith(".dockerfile")) return "dockerfile";
  if (/\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|mp3|mp4|mov|wasm|woff2?|ttf|eot)$/i.test(lower)) return "asset";
  return "plaintext";
}

export function normalizeImportPath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+/g, "/");
}

export function importedFileId(path: string) {
  return `imported-file-${hashPath(path)}-${safeId(path.split("/").pop() ?? "file")}`;
}

export function importedFolderId(path: string) {
  return `imported-folder-${hashPath(path)}-${safeId(path.split("/").pop() ?? "folder")}`;
}

export function fuzzyScore(query: string, value: string) {
  const needle = query.trim().toLowerCase();
  const haystack = value.toLowerCase();
  if (!needle) return 1;
  if (haystack.includes(needle)) return 100 - haystack.indexOf(needle);

  let score = 0;
  let cursor = 0;
  for (const character of needle) {
    const found = haystack.indexOf(character, cursor);
    if (found === -1) return 0;
    score += found === cursor ? 8 : 2;
    cursor = found + 1;
  }
  return score;
}

export function simulateRun(file: WorkspaceFile | undefined) {
  if (!file) return ["No active file. Open a file before running."];

  if (file.path.endsWith("package.json")) {
    return [
      "> npm run build",
      "vite v6.0.0 building for production...",
      "transformed 18 modules",
      "dist/index.html  0.62 kB",
      "dist/assets/app.js  27.4 kB",
      "Build completed in 482ms."
    ];
  }

  if (file.path.endsWith(".test.ts")) {
    return [
      "> vitest run",
      "RUN  tests/math.test.ts",
      "✓ math helpers > adds two numbers",
      "Test Files  1 passed",
      "Tests       1 passed"
    ];
  }

  if (file.language === "typescript") {
    return [
      `> tsx ${file.path}`,
      "TypeScript compiled with 0 errors.",
      "Preview server refreshed at http://localhost:5173/"
    ];
  }

  if (file.language === "css") {
    return ["> stylelint src/styles.css", "0 problems found.", "Styles were hot-reloaded in the preview panel."];
  }

  if (file.language === "html" || /\.html?$/i.test(file.path)) {
    return [`Serving ${file.path}`, "Local URL: http://localhost:5173/", "Preview opened in the PREVIEW panel."];
  }

  return [`Opened ${file.path}. Nothing runnable was configured for this language.`];
}

function hashPath(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}
