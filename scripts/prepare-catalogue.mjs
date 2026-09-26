import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sharp = require('../frontend/node_modules/sharp')
const root = path.resolve('frontend/public/images/Edited picture for kaldoni')
const output = path.resolve('artifacts/catalogue-import')
await mkdir(output, { recursive: true })
async function walk(dir) { const files = []; for (const entry of await readdir(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) files.push(...await walk(file)); else if (/\.(png|heic)$/i.test(file)) files.push(file) } return files.sort() }
const files = await walk(root), groups = new Map(), skipped = []
for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/')
  if (relative.startsWith('Home_slideshow/')) { skipped.push(relative); continue }
  const base = path.basename(file).replace(/\.(png|heic)$/i, '').replace(/\.jpg$/i, '').replace(/[-.]?(front|side)(jpg)?$/i, '')
  const key = path.dirname(relative) + '/' + base
  const group = groups.get(key) || { sourceKey: key, folder: path.dirname(relative), files: [] }
  group.files.push(relative); groups.set(key, group)
}
const products = [...groups.values()].map((p, i) => ({ index: i + 1, ...p, files: p.files.sort((a, b) => Number(/side/i.test(a)) - Number(/side/i.test(b))) }))
for (const product of products) {
  product.hashes = await Promise.all(product.files.map(async f => createHash('sha256').update(await readFile(path.join(root, f))).digest('hex')))
}
await writeFile(path.join(output, 'sources.json'), JSON.stringify({ products, slideshowCopies: skipped }, null, 2))
const imageProducts = products.filter(p => /\.png$/i.test(p.files[0]))
for (let offset = 0; offset < imageProducts.length; offset += 16) {
  const page = imageProducts.slice(offset, offset + 16), cells = []
  for (let i = 0; i < page.length; i++) {
    const item = page[i], x = (i % 4) * 340, y = Math.floor(i / 4) * 330
    cells.push({ input: await sharp(path.join(root, item.files[0])).rotate().resize(330, 275, { fit: 'inside' }).extend({ top: 0, bottom: 0, left: 0, right: 0, background: 'white' }).png().toBuffer(), left: x, top: y })
    const label = `${item.index}: ${path.basename(item.sourceKey)}`.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    const chunks = label.match(/.{1,44}/g) || []
    const svg = `<svg width="340" height="55"><rect width="340" height="55" fill="white"/><text font-family="Arial" font-size="12" fill="black">${chunks.map((s, j) => `<tspan x="4" y="${15 + j * 14}">${s}</tspan>`).join('')}</text></svg>`
    cells.push({ input: Buffer.from(svg), left: x, top: y + 275 })
  }
  await sharp({ create: { width: 1360, height: Math.ceil(page.length / 4) * 330, channels: 3, background: 'white' } }).composite(cells).png().toFile(path.join(output, `sheet-${offset / 16 + 1}.png`))
}
console.log(JSON.stringify({ files: files.length, products: products.length, pngProducts: imageProducts.length, heicProducts: products.length - imageProducts.length, slideshowCopies: skipped.length, byFolder: products.reduce((counts, p) => { counts[p.folder] = (counts[p.folder] || 0) + 1; return counts }, {}) }, null, 2))
