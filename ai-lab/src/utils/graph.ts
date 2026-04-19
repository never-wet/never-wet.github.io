import type { GraphLinkRecord, GraphNodeRecord, NodeCategory } from '../memory/types'

export const buildAdjacencyMap = (links: GraphLinkRecord[]) => {
  const adjacency = new Map<string, Set<string>>()

  for (const link of links) {
    if (!adjacency.has(link.source)) {
      adjacency.set(link.source, new Set())
    }

    if (!adjacency.has(link.target)) {
      adjacency.set(link.target, new Set())
    }

    adjacency.get(link.source)?.add(link.target)
    adjacency.get(link.target)?.add(link.source)
  }

  return adjacency
}

const matchesSearch = (node: GraphNodeRecord, query: string) => {
  if (!query) {
    return true
  }

  const haystack = [node.title, node.summary, node.tags.join(' ')].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export const filterGraph = ({
  nodes,
  links,
  categoryFilters,
  search,
  selectedNodeId,
  showOnlyConnected,
}: {
  nodes: GraphNodeRecord[]
  links: GraphLinkRecord[]
  categoryFilters: Record<NodeCategory, boolean>
  search: string
  selectedNodeId?: string
  showOnlyConnected: boolean
}) => {
  const adjacency = buildAdjacencyMap(links)
  const directNeighbors = selectedNodeId
    ? adjacency.get(selectedNodeId) ?? new Set<string>()
    : new Set<string>()
  const visible = new Set<string>()
  const matching = new Set<string>()

  for (const node of nodes) {
    if (!categoryFilters[node.category]) {
      continue
    }

    if (matchesSearch(node, search)) {
      visible.add(node.id)
      matching.add(node.id)
    }
  }

  if (search) {
    for (const id of [...matching]) {
      for (const neighbor of adjacency.get(id) ?? []) {
        visible.add(neighbor)
      }
    }
  }

  if (!search) {
    for (const node of nodes) {
      if (categoryFilters[node.category]) {
        visible.add(node.id)
      }
    }
  }

  if (showOnlyConnected && selectedNodeId) {
    const connectedScope = new Set<string>([selectedNodeId, ...directNeighbors])
    for (const id of [...visible]) {
      if (!connectedScope.has(id)) {
        visible.delete(id)
      }
    }
  }

  const filteredNodes = nodes.filter((node) => visible.has(node.id))
  const filteredLinks = links.filter(
    (link) => visible.has(link.source) && visible.has(link.target),
  )

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    adjacency,
    directNeighbors,
    matching,
  }
}

export const groupNodesByCategory = (nodes: GraphNodeRecord[]) =>
  nodes.reduce<Record<NodeCategory, GraphNodeRecord[]>>(
    (groups, node) => {
      groups[node.category].push(node)
      return groups
    },
    {
      neural: [],
      note: [],
      dataset: [],
      experiment: [],
      model: [],
      idea: [],
      task: [],
      layerGroup: [],
      result: [],
    },
  )
