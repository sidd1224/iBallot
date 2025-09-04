const fs = require('fs')
const path = require('path')
const root = process.cwd()
function exists(p) { try { return fs.existsSync(p) } catch { return false } }
const idx = path.join(root, 'index.html')
if (!exists(idx)) { console.error('No index.html'); process.exit(1) }
const html = fs.readFileSync(idx, 'utf8')
const m = html.match(/<script[^>]+src=["']([^"']+)["']/i)
if (!m) { console.error('No script src found'); process.exit(1) }
const src = m[1]
console.log('index.html ->', src)
const filePath = path.join(root, src.replace(/^[\\/]/, ''))
console.log('Expected file:', filePath)
console.log('Exists:', exists(filePath))
function findIndexTsx(dir) {
  const out = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  for (const it of items) {
    const p = path.join(dir, it.name)
    if (it.isDirectory()) { if (['node_modules', '.git', 'dist'].includes(it.name)) continue; out.push(...findIndexTsx(p)) }
    else if (it.isFile() && it.name.toLowerCase() === 'index.tsx') out.push(p)
  }
  return out
}
const stray = findIndexTsx(root)
if (stray.length) { console.log('\nFound index.tsx files:'); stray.forEach(s => console.log(' -', s)) } else console.log('\nNo index.tsx found')
