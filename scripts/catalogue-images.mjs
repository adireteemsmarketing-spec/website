import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sharp = require('../frontend/node_modules/sharp')
const convert = require('./catalogue-tools/node_modules/heic-convert')
const root = path.resolve('frontend/public/images/Edited picture for kaldoni')
const output = path.resolve('artifacts/catalogue-import')
const { products } = JSON.parse(await readFile(path.join(output, 'sources.json'), 'utf8'))
await mkdir(path.join(output, 'images'), { recursive: true })
for (const p of products) {
  p.prepared = []
  for (let i = 0; i < p.files.length; i++) {
    const filename = `${String(p.index).padStart(3, '0')}-${i + 1}.webp`, dest = path.join(output, 'images', filename)
    try { await readFile(dest) } catch {
      let input = await readFile(path.join(root, p.files[i]))
      if (/\.heic$/i.test(p.files[i])) input = Buffer.from(await convert({ buffer: input, format: 'JPEG', quality: 0.94 }))
      await sharp(input).rotate().resize({ width: 1600, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(dest)
    }
    p.prepared.push(filename)
  }
  console.log(`Prepared ${p.index}/${products.length}: ${path.basename(p.sourceKey)}`)
}
await writeFile(path.join(output, 'prepared.json'), JSON.stringify(products, null, 2))
const fabrics = products.filter(p => p.folder === 'Fabrics/ankara fabrics')
for (let offset = 0; offset < fabrics.length; offset += 12) {
  const page = fabrics.slice(offset, offset + 12), cells = []
  for (let i = 0; i < page.length; i++) {
    const p = page[i], left = i % 4 * 300, top = Math.floor(i / 4) * 330
    cells.push({ input: await sharp(path.join(output, 'images', p.prepared[0])).resize(290, 285, { fit: 'inside' }).png().toBuffer(), left, top })
    cells.push({ input: Buffer.from(`<svg width="300" height="40"><rect width="300" height="40" fill="white"/><text x="5" y="24" font-family="Arial" font-size="17">${p.index}: ${path.basename(p.sourceKey)}</text></svg>`), left, top: top + 285 })
  }
  await sharp({ create: { width: 1200, height: Math.ceil(page.length / 4) * 330, channels: 3, background: 'white' } }).composite(cells).png().toFile(path.join(output, `ankara-${offset / 12 + 1}.png`))
}
