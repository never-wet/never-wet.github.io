import type {
  ExtensionApi,
  ExtensionPanelContribution,
  SnippetContribution,
  StatusContribution,
  WorkspaceCommand,
  WorkspaceExtension
} from "@/lib/types";

export interface ExtensionHostSnapshot {
  commands: WorkspaceCommand[];
  panels: ExtensionPanelContribution[];
  snippets: SnippetContribution[];
  statusItems: StatusContribution[];
}

export function activateExtensions(extensions: WorkspaceExtension[]): ExtensionHostSnapshot {
  const commands: WorkspaceCommand[] = [];
  const panels: ExtensionPanelContribution[] = [];
  const snippets: SnippetContribution[] = [];
  const statusItems: StatusContribution[] = [];

  for (const extension of extensions) {
    const api: ExtensionApi = {
      registerCommand: (command) => commands.push(command),
      registerSnippet: (snippet) => snippets.push(snippet),
      registerPanel: (panel) =>
        panels.push({
          ...panel,
          extensionId: extension.id
        }),
      decorateStatusBar: (item) => statusItems.push(item)
    };

    extension.activate(api);
  }

  return { commands, panels, snippets, statusItems };
}
