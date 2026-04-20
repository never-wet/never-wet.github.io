import type { GraphLinkRecord, GraphNodeRecord } from '../memory/types'

interface ImportedFolderGraph {
  nodes: GraphNodeRecord[]
  links: GraphLinkRecord[]
  rootNodeId: string
}

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'json',
  'csv',
  'ts',
  'tsx',
  'js',
  'jsx',
  'html',
  'css',
  'scss',
  'yml',
  'yaml',
  'xml',
])

const createId = (prefix: string, seed: string) =>
  `${prefix}-${seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 7)}`

const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const extensionFromName = (name: string) => name.split('.').pop()?.toLowerCase()

const shouldPreviewFile = (file: File) => {
  const extension = extensionFromName(file.name)
  return file.type.startsWith('text/') || (extension ? TEXT_EXTENSIONS.has(extension) : false)
}

const fileSummary = (file: File, extension?: string) =>
  `${extension ? `${extension.toUpperCase()} file` : 'File'} • ${formatBytes(file.size)}`

export const createImportedFolderGraph = async (files: FileList | File[]): Promise<ImportedFolderGraph> => {
  const fileEntries = Array.from(files).filter(
    (file) => file.webkitRelativePath && file.webkitRelativePath.includes('/'),
  )

  if (fileEntries.length === 0) {
    throw new Error('Choose a folder, not a single file. The browser needs relative folder paths to build the tree.')
  }

  const rootName = fileEntries[0].webkitRelativePath.split('/')[0]
  const sessionSeed = `${rootName}-${Date.now().toString(36)}`
  const pathToNodeId = new Map<string, string>()
  const nodes = new Map<string, GraphNodeRecord>()
  const links = new Map<string, GraphLinkRecord>()
  const childCounts = new Map<string, number>()

  const ensureFolderNode = (folderPath: string, depth: number, parentPath?: string) => {
    const existingId = pathToNodeId.get(folderPath)
    if (existingId) {
      return existingId
    }

    const title = folderPath.split('/').pop() ?? folderPath
    const nodeId = createId('folder', `${sessionSeed}-${folderPath}`)
    const parentNodeId = parentPath ? pathToNodeId.get(parentPath) : undefined
    const node: GraphNodeRecord = {
      id: nodeId,
      title,
      category: 'folder',
      summary: depth === 0 ? 'Imported root folder.' : 'Imported folder.',
      cluster: 'import-bay',
      group: 'workflow',
      tags: ['imported', 'folder'],
      entityKind: 'folder',
      emphasis: depth === 0 ? 0.92 : 0.78,
      parentNodeId,
      importPath: folderPath,
      isCollapsed: depth > 0,
      x: 156 + depth * 26,
      y: 18 - depth * 12,
      z: 112 - depth * 18,
    }

    nodes.set(nodeId, node)
    pathToNodeId.set(folderPath, nodeId)

    if (parentNodeId) {
      const linkId = createId('link', `${parentNodeId}-${nodeId}`)
      links.set(linkId, {
        id: linkId,
        source: parentNodeId,
        target: nodeId,
        relation: 'contains',
        strength: 0.92,
      })
      childCounts.set(parentNodeId, (childCounts.get(parentNodeId) ?? 0) + 1)
    }

    return nodeId
  }

  const rootNodeId = ensureFolderNode(rootName, 0)

  for (const file of fileEntries) {
    const segments = file.webkitRelativePath.split('/')
    let currentPath = segments[0]
    ensureFolderNode(currentPath, 0)

    for (let index = 1; index < segments.length - 1; index += 1) {
      const parentPath = currentPath
      currentPath = `${currentPath}/${segments[index]}`
      ensureFolderNode(currentPath, index, parentPath)
    }

    const parentPath = currentPath
    const parentNodeId = pathToNodeId.get(parentPath)

    if (!parentNodeId) {
      continue
    }

    const extension = extensionFromName(file.name)
    const nodeId = createId('file', `${sessionSeed}-${file.webkitRelativePath}`)
    const preview = shouldPreviewFile(file) ? (await file.text()).slice(0, 900) : undefined
    const fileNode: GraphNodeRecord = {
      id: nodeId,
      title: file.name,
      category: 'file',
      summary: fileSummary(file, extension),
      cluster: 'import-bay',
      group: 'data',
      tags: ['imported', extension ?? 'file'],
      entityKind: 'file',
      emphasis: 0.58,
      parentNodeId,
      importPath: file.webkitRelativePath,
      contentPreview: preview,
      mimeType: file.type || undefined,
      fileExtension: extension,
      fileSize: file.size,
      x: 156 + segments.length * 24,
      y: 18 - segments.length * 14,
      z: 112 - segments.length * 14,
    }

    nodes.set(nodeId, fileNode)

    const linkId = createId('link', `${parentNodeId}-${nodeId}`)
    links.set(linkId, {
      id: linkId,
      source: parentNodeId,
      target: nodeId,
      relation: 'contains',
      strength: 0.84,
    })

    childCounts.set(parentNodeId, (childCounts.get(parentNodeId) ?? 0) + 1)
  }

  for (const node of nodes.values()) {
    if (node.category !== 'folder') {
      continue
    }

    const children = childCounts.get(node.id) ?? 0
    node.summary =
      node.id === rootNodeId
        ? `Imported root folder with ${children} direct item${children === 1 ? '' : 's'}.`
        : `Folder with ${children} direct item${children === 1 ? '' : 's'}. Click to ${node.isCollapsed ? 'expand' : 'collapse'}.`
  }

  return {
    nodes: [...nodes.values()],
    links: [...links.values()],
    rootNodeId,
  }
}
