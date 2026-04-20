import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const sourceHtml = path.join(distDir, 'dev.html')
const targetHtml = path.join(root, 'index.html')
const copyTargets = [
  ['assets', true],
  ['favicon.svg', false],
]

if (!fs.existsSync(sourceHtml)) {
  throw new Error('Expected dist/dev.html after Vite build.')
}

fs.copyFileSync(sourceHtml, targetHtml)

for (const [name, isDirectory] of copyTargets) {
  const source = path.join(distDir, name)
  const target = path.join(root, name)

  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
  }

  if (!fs.existsSync(source)) {
    continue
  }

  if (isDirectory) {
    fs.cpSync(source, target, { recursive: true })
  } else {
    fs.copyFileSync(source, target)
  }
}
