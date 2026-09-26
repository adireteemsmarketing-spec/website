import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const expected = JSON.parse(await readFile('artifacts/catalogue-import/products.json', 'utf8'))
const response = await fetch('http://localhost:3000/api/store')
assert.equal(response.status, 200, 'Store API must load successfully')
const { products } = await response.json()
const imported = products.filter(p => expected.some(e => e.id === p.id))
assert.equal(imported.length, expected.length, 'All imported products must be visible')
for (const entry of expected) {
  const saved = imported.find(p => p.id === entry.id)
  assert.equal(saved.name, entry.name)
  assert.equal(saved.price, entry.price)
  assert.equal(saved.currency, 'NGN')
  assert.ok(!('stock' in saved), 'Exact stock counts must remain private')
  assert.equal(saved.description, entry.description)
  assert.equal(saved.images.length, entry.images.length)
  assert.deepEqual([...saved.sizes].sort(), [...entry.sizes].sort())
  assert.equal(saved.inStock, true, `${saved.name}: sample stock must be available`)
}
console.log(`PASS: all ${imported.length} products, descriptions, NGN prices, image galleries and sample sizes are visible in the live shop`)
for (const index of [5, 47, 101]) {
  const product = expected.find(p => p.index === index)
  const page = await fetch(`http://localhost:3000/product/${product.slug}`)
  assert.equal(page.status, 200, product.name)
  const html = await page.text()
  assert.ok(html.includes(product.id), 'Product page should contain the imported product')
  console.log(`PASS: product page ${product.slug}`)
}
if (process.argv.includes('--images')) {
  const urls = [...new Set(imported.flatMap(p => p.images.map(i => i.url)))], queue = [...urls]
  async function worker() { while (queue.length) { const url = queue.shift(); const image = await fetch(url, { method: 'HEAD' }); assert.equal(image.status, 200, url); assert.ok(image.headers.get('content-type')?.includes('image/webp'), 'Optimised image must be WebP') } }
  await Promise.all(Array.from({ length: 4 }, worker))
  console.log(`PASS: all ${urls.length} public Supabase image URLs return HTTP 200`)
}
await writeFile('artifacts/catalogue-import/verification.json', JSON.stringify({ verifiedAt: new Date().toISOString(), products: imported.length, imageCount: imported.reduce((n, p) => n + p.images.length, 0), stockAvailable: imported.filter(p => p.inStock).length, publicImagesChecked: process.argv.includes('--images') }, null, 2))
