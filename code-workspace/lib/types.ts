import type { ComponentType } from "react";

export type ActivityView = "explorer" | "search" | "source" | "run" | "extensions" | "settings";

export type BottomPanelView = "terminal" | "problems" | "output" | "debug" | "preview";

export type WorkspaceTheme = "dark" | "light" | "contrast";

export type FileNodeType = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  language?: string;
  children?: FileNode[];
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  originalContent: string;
  modified: boolean;
  assetKind?: "image" | "video" | "audio" | "svg" | "binary";
  blobKey?: string;
  dataUrl?: string;
  mimeType?: string;
  size?: number;
}

export interface ImportedWorkspaceFile {
  name: string;
  path: string;
  content: string;
  assetKind?: "image" | "video" | "audio" | "svg" | "binary";
  blobKey?: string;
  dataUrl?: string;
  mimeType?: string;
  size?: number;
}

export interface SnippetContribution {
  id: string;
  label: string;
  language: string;
  detail: string;
  body: string;
}

export interface StatusContribution {
  id: string;
  label: string;
  tone?: "default" | "accent" | "success" | "warning";
}

export interface WorkspaceCommand {
  id: string;
  title: string;
  category: string;
  keybinding?: string;
  keywords?: string[];
  run: () => void;
}

export interface ExtensionPanelComponentProps {
  extensionId: string;
}

export interface ExtensionPanelContribution {
  id: string;
  extensionId: string;
  title: string;
  Component: ComponentType<ExtensionPanelComponentProps>;
}

export interface ExtensionApi {
  registerCommand: (command: WorkspaceCommand) => void;
  registerSnippet: (snippet: SnippetContribution) => void;
  registerPanel: (panel: Omit<ExtensionPanelContribution, "extensionId">) => void;
  decorateStatusBar: (item: StatusContribution) => void;
}

export interface WorkspaceExtension {
  id: string;
  displayName: string;
  publisher: string;
  description: string;
  activationEvent: string;
  activate: (api: ExtensionApi) => void;
}
