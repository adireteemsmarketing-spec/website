/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS tooling uses the installed frontend packages. */
// Run against the locally built server; reads product pages only.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const directory = path.resolve(__dirname, '../../artifacts/product-seo')
const snapshot = JSON.parse(fs.readFileSync(path.join(directory, 'before.json'), 'utf8'))
const proposal = JSON.parse(fs.readFileSync(path.join(directory, 'proposal.json'), 'utf8'))
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const content = tag => decode(tag.match(/\bcontent="([^"]*)"/)?.[1] || '')
async function main() {
  const published = snapshot.products.filter(row => row.status === 'active')
  const selected = [...new Map([
    published.find(row => !row.meta_description?.trim()),
    published.find(row => row.meta_description?.trim()),
    published.find(row => /[&'’À-ž]/.test(row.name)),
    published[published.length - 1],
  ].filter(Boolean).map(row => [row.id, row])).values()]
  const results = []
  for (const row of selected) {
    const response = await fetch(`http://localhost:3016/product/${row.slug}`, { headers: { 'User-Agent': 'Googlebot' } })
    assert.equal(response.status, 200, row.slug)
    const html = await response.text()
    const tags = html.match(/<meta\b[^>]*>/g) || []
    const descriptions = tags.filter(tag => /\bname="description"/.test(tag))
    assert.equal(descriptions.length, 1, `${row.slug}: must have exactly one description`)
    const expected = proposal.find(item => item.id === row.id).proposed
    assert.equal(content(descriptions[0]), expected, row.slug)
    const og = tags.find(tag => /\bproperty="og:description"/.test(tag))
    assert.equal(content(og || ''), expected)
    const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || '')
    assert.equal(title, row.seo_title || `${row.name} | Adire Teems`)
    const canonical = (html.match(/<link\b[^>]*>/g) || []).find(tag => /rel="canonical"/.test(tag))
    assert.equal(decode(canonical?.match(/href="([^"]*)"/)?.[1] || ''), row.canonical_url || `https://adireteems.com/product/${row.slug}`)
    results.push({ id: row.id, slug: row.slug, status: response.status, title, description: expected, descriptionTag: descriptions[0], descriptionTagCount: descriptions.length, canonicalTag: canonical, openGraphDescription: content(og), structuredDataTags: (html.match(/type="application\/ld\+json"/g) || []).length })
  }
  assert.ok(new Set(results.map(row => row.description)).size > 1, 'Product descriptions must change between routes')
  fs.writeFileSync(path.join(directory, 'render-validation.json'), JSON.stringify({ verifiedAt: new Date().toISOString(), results }, null, 2) + '\n')
  console.log(`PASS: ${results.length} rendered product pages; one description per page; correct description, title, canonical and Open Graph.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
