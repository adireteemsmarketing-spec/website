import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')
const directory = path.resolve('artifacts/catalogue-import')
const products = JSON.parse(await readFile(path.join(directory, 'products.json'), 'utf8'))
const apply = process.argv.includes('--apply')
const demoStock = process.argv.includes('--without-stock') ? 0 : 5
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const uuid = value => { const h = createHash('sha256').update(value).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}` }
function checked(result, label) { if (result.error) throw Error(`${label}: ${result.error.message}`); return result.data }
const categories = checked(await db.from('categories').select('id,slug'), 'Categories')
const locations = checked(await db.from('locations').select('id,name').eq('active', true), 'Locations')
const location = locations.find(l => l.name === 'Online Store')
if (!location) throw Error('An active Online Store inventory location is required.')
const existing = checked(await db.from('products').select('id,legacy_id,slug,status').in('id', products.map(p => p.id)), 'Existing products')
const conflicts = checked(await db.from('products').select('id,slug').in('slug', products.map(p => p.slug)), 'Slug check')
for (const p of products) {
  if (!categories.some(c => c.slug === p.category)) throw Error(`Unknown category: ${p.category}`)
  if (existing.some(e => e.id === p.id && e.legacy_id !== p.legacy_id) || conflicts.some(e => e.slug === p.slug && e.id !== p.id)) throw Error(`Refusing to overwrite an unrelated product: ${p.name}`)
  for (const image of p.images) { const bytes = await readFile(path.join(directory, 'images', image.local)); if (bytes.length > 5 * 1024 * 1024) throw Error(`Image too large: ${image.local}`) }
}
const summary = { products: products.length, images: products.reduce((n, p) => n + p.images.length, 0), variants: products.reduce((n, p) => n + p.sizes.length, 0), placeholderStockPerSize: demoStock, currency: 'NGN', location: location.name, existingImportedProducts: existing.length }
console.log('Import plan:', JSON.stringify(summary))
if (!apply) { console.log('Read-only validation complete. Use --apply to publish this catalogue.'); process.exit(0) }

// Draft first; only publish after every image, size and inventory row exists.
// Existing task-owned records can be resumed. Unrelated products are never modified.
const records = products.map(p => ({ id: p.id, legacy_id: p.legacy_id, name: p.name, slug: p.slug, description_short: p.description, description_long: p.description, category_id: categories.find(c => c.slug === p.category).id, department: p.department, fabric: p.fabric, base_price: p.price, currency: p.currency, unit: p.unit, status: 'draft', style_group: p.styleGroup, style: p.style, sku: p.sku, seo_title: p.name + ' | Adire Teems', meta_description: p.description.slice(0, 160) }))
checked(await db.from('products').upsert(records, { onConflict: 'id', ignoreDuplicates: true }), 'Create draft products')
let uploaded = 0
const queue = products.flatMap(p => p.images.map(image => ({ product: p, image })))
async function uploadWorker() {
  while (queue.length) {
    const { product, image } = queue.shift()
    const bytes = await readFile(path.join(directory, 'images', image.local))
    const result = await db.storage.from('product-images').upload(image.storage, bytes, { contentType: 'image/webp', cacheControl: '31536000', upsert: false })
    if (result.error && !['409', '400'].includes(String(result.error.statusCode))) throw Error(`Image upload ${product.name}: ${result.error.message}`)
    if (result.error) {
      const listing = checked(await db.storage.from('product-images').list(path.posix.dirname(image.storage), { search: path.posix.basename(image.storage) }), 'Verify existing image')
      if (!listing.some(f => f.name === path.posix.basename(image.storage) && Number(f.metadata?.size) === bytes.length)) throw Error(`Existing image does not match: ${image.storage}`)
    }
    uploaded++; if (uploaded % 10 === 0 || uploaded === summary.images) console.log(`Uploaded ${uploaded}/${summary.images} product images`)
  }
}
await Promise.all(Array.from({ length: 4 }, uploadWorker))
const imageRows = products.flatMap(p => p.images.map(image => ({ id: image.id, product_id: p.id, storage_path: db.storage.from('product-images').getPublicUrl(image.storage).data.publicUrl, alt_text: image.alt, sort_order: image.sort_order })))
checked(await db.from('product_images').upsert(imageRows, { onConflict: 'id', ignoreDuplicates: true }), 'Save image references')
const variants = products.flatMap(p => p.sizes.map(size => ({ id: uuid(p.id + ':' + size), product_id: p.id, size, color: 'As pictured', sku: p.sku + '-' + createHash('sha256').update(size).digest('hex').slice(0, 6).toUpperCase(), active: true })))
checked(await db.from('product_variants').upsert(variants, { onConflict: 'id', ignoreDuplicates: true }), 'Create sizes')
const inventory = variants.map(v => ({ id: uuid('stock:' + v.id + ':' + location.id), variant_id: v.id, location_id: location.id, quantity: demoStock, reserved: 0 }))
const priorStock = checked(await db.from('inventory').select('id').in('id', inventory.map(i => i.id)), 'Existing sample stock')
checked(await db.from('inventory').upsert(inventory, { onConflict: 'id', ignoreDuplicates: true }), 'Create sample stock')
const priorIds = new Set(priorStock.map(i => i.id))
if (demoStock) checked(await db.from('inventory_logs').upsert(inventory.filter(i => !priorIds.has(i.id)).map(i => ({ id: uuid('opening-stock:' + i.id), inventory_id: i.id, variant_id: i.variant_id, location_id: i.location_id, change_qty: demoStock, previous_qty: 0, resulting_qty: demoStock, reason: 'Kaldoni catalogue preview: sample inventory, not a physical stock count' })), { onConflict: 'id', ignoreDuplicates: true }), 'Record sample-stock audit')
const ids = products.map(p => p.id)
const savedImages = checked(await db.from('product_images').select('id,product_id').in('product_id', ids), 'Verify gallery')
const savedVariants = checked(await db.from('product_variants').select('id,product_id').in('product_id', ids), 'Verify sizes')
if (savedImages.length !== summary.images || savedVariants.length !== summary.variants) throw Error('Product validation failed; drafts remain unpublished.')
checked(await db.from('products').update({ status: 'active' }).in('id', ids).eq('status', 'draft'), 'Publish products')
const published = checked(await db.from('products').select('id,name,slug,status').in('id', ids), 'Verify publication')
if (published.some(p => p.status !== 'active')) throw Error('Some products are not published; review the import report.')
const report = { ...summary, completedAt: new Date().toISOString(), placeholderNotice: 'Prices, sizes and stock are preview data. Replace them before accepting real orders.', products: published.map(p => ({ ...p, localUrl: `http://localhost:3000/product/${p.slug}` })) }
await writeFile(path.join(directory, 'import-result.json'), JSON.stringify(report, null, 2))
console.log('SUCCESS:', JSON.stringify(summary))
