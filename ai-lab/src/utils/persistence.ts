import { get, set } from 'idb-keyval'

import { storageKeys } from '../memory/storageKeys'
import { wrapWorkspaceForExport } from '../memory/saveSchema'
import type { WorkspaceStateData } from '../memory/types'

const fileName = () => {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `${storageKeys.exportedFilePrefix}-${stamp}.json`
}

export const saveWorkspaceSnapshot = async (workspace: WorkspaceStateData) => {
  await set(storageKeys.workspaceSnapshot, workspace)
}

export const loadWorkspaceSnapshot = async () =>
  (await get(storageKeys.workspaceSnapshot)) as WorkspaceStateData | undefined

export const downloadWorkspace = (workspace: WorkspaceStateData) => {
  const payload = wrapWorkspaceForExport(workspace)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName()
  anchor.click()
  URL.revokeObjectURL(url)
}

export const readWorkspaceFile = async (file: File) => {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
