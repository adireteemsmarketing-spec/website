/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS tooling uses the installed frontend packages. */
// Read-only catalogue snapshot and offline proposal. Never writes to Supabase.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { loadEnvConfig } = require('@next/env')
const { createClient } = require('@supabase/supabase-js')
const root = path.resolve(__dirname, '../..')
const output = path.join(root, 'artifacts/product-seo')
const moduleSeo = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/product-seo.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: moduleSeo.exports, module: moduleSeo })
const { productDescription, generatedProductDescription } = moduleSeo.exports
const quote = value => "'" + value.replaceAll("'", "''") + "'"
const model = row => ({ name: row.name, fabric: row.fabric || '', style: row.style || '', description: row.description_long || row.description_short || '', metaDescription: row.meta_description || '' })
const words = value => new Set(value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
const similar = (a, b) => {
  const left = words(a), right = words(b)
  return [...left].filter(w => right.has(w)).length / new Set([...left, ...right]).size
}
async function main() {
  fs.mkdirSync(output, { recursive: true })
  let snapshot
  if (process.argv.includes('--snapshot')) {
    loadEnvConfig(path.join(root, 'frontend'))
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const products = []
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from('products').select('id,sku,name,slug,status,fabric,style,style_group,description_short,description_long,meta_description,seo_title,canonical_url,noindex,updated_at').order('id').range(offset, offset + 499)
      if (error) throw Error(error.message)
      products.push(...data)
      if (data.length < 500) break
    }
    snapshot = { capturedAt: new Date().toISOString(), products }
    // Refuse to overwrite the original backup, even on a repeated audit.
    fs.writeFileSync(path.join(output, 'before.json'), JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' })
  } else snapshot = JSON.parse(fs.readFileSync(path.join(output, 'before.json'), 'utf8'))
  const rows = snapshot.products.map(row => {
    const product = model(row), description = productDescription(product)
    const preserved = Boolean(row.meta_description?.trim())
    const missingInformation = [!row.fabric?.trim() && 'fabric', !row.style?.trim() && !row.style_group?.trim() && !product.description.trim() && 'style or design details', !product.description.trim() && 'product description'].filter(Boolean)
    const flags = [description.length < 140 && 'shorter than 140 characters', description.length > 160 && 'longer than 160 characters', !description.toLowerCase().includes(row.name.toLowerCase()) && 'existing description does not include full product name', /["“”]/.test(description) && 'quotation marks', missingInformation.length > 0 && 'incomplete product attributes'].filter(Boolean)
    return { id: row.id, sku: row.sku, name: row.name, slug: row.slug, status: row.status, before: row.meta_description, proposed: description, safeAlternative: generatedProductDescription(product), source: preserved ? 'preserved' : 'generated', length: description.length, missingInformation, flags }
  })
  const duplicates = [], similarPairs = []
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const pair = { ids: [rows[a].id, rows[b].id], names: [rows[a].name, rows[b].name] }
    if (rows[a].proposed.trim().toLowerCase() === rows[b].proposed.trim().toLowerCase()) duplicates.push(pair)
    else if (similar(rows[a].proposed, rows[b].proposed) >= 0.8) similarPairs.push(pair)
  }
  const review = rows.filter(row => row.flags.length || [...duplicates, ...similarPairs].some(pair => pair.ids.includes(row.id)))
    .map(row => ({ ...row, reason: [...row.flags, ...([...duplicates, ...similarPairs].some(pair => pair.ids.includes(row.id)) ? ['duplicate or substantially similar description'] : [])].join('; ') + '. Existing copy is preserved; confirm editorial changes before applying them.' }))
  const generated = rows.filter(row => row.source === 'generated')
  const summary = {
    capturedAt: snapshot.capturedAt, reviewed: rows.length, published: rows.filter(row => row.status === 'active').length,
    created: generated.length, preserved: rows.length - generated.length, requiringReview: review.length,
    publishedWithoutDescriptionBefore: rows.filter(row => row.status === 'active' && !row.before?.trim()).length,
    publishedWithoutDescriptionAfterProposal: rows.filter(row => row.status === 'active' && !row.proposed.trim()).length,
    exactDuplicates: duplicates.length, substantiallySimilarPairs: similarPairs.length,
    lengthFlags: rows.filter(row => row.length < 140 || row.length > 160).length,
    missingProductInformation: rows.filter(row => row.missingInformation.length).length,
    publishedRequiringReview: review.filter(row => row.status === 'active').length,
    state: 'Prepared only. No database updates or deployment performed.',
  }
  const write = (name, data) => fs.writeFileSync(path.join(output, name), JSON.stringify(data, null, 2) + '\n')
  write('proposal.json', rows); write('review.json', review); write('duplicates.json', { duplicates, similarPairs }); write('summary.json', summary)
  const csv = value => '"' + String(value ?? '').replaceAll('"', '""') + '"'
  const reviewTable = [['Product name', 'Product ID', 'SKU', 'Status', 'Missing information', 'Current description', 'Proposed safe alternative', 'Reason for review'],
    ...review.map(row => [row.name, row.id, row.sku, row.status, row.missingInformation.join('; ') || 'None recorded', row.proposed, row.safeAlternative, row.reason])]
  fs.writeFileSync(path.join(output, 'review.csv'), '\uFEFF' + reviewTable.map(row => row.map(csv).join(',')).join('\r\n') + '\r\n')
  const original = new Map(snapshot.products.map(row => [row.id, row]))
  const updates = generated.map(row => `update public.products set meta_description=${quote(row.proposed)} where id=${quote(row.id)}::uuid and updated_at=${quote(original.get(row.id).updated_at)}::timestamptz and coalesce(btrim(meta_description),'')='';`)
  fs.writeFileSync(path.join(output, 'backfill.sql'), '-- REVIEW BEFORE APPLYING. Only blank descriptions at the audited revision are eligible.\nbegin;\n' + updates.join('\n') + '\ncommit;\n')
  const rollback = generated.map(row => `update public.products set meta_description=${row.before == null ? 'null' : quote(row.before)} where id=${quote(row.id)}::uuid and meta_description=${quote(row.proposed)};`)
  fs.writeFileSync(path.join(output, 'rollback.sql'), '-- Conditional rollback; preserve any later manual edits.\nbegin;\n' + rollback.join('\n') + '\ncommit;\n')
  console.log(JSON.stringify(summary, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
