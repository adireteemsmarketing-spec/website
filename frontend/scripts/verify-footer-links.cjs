/* eslint-disable @typescript-eslint/no-require-imports -- Read-only Node HTTP verification. */
// Start the new production build on localhost:3017 before running this script.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const base = 'http://localhost:3017'
const expected = [
  { label: 'FAQ', path: '/faq', text: 'Frequently Asked Questions' },
  { label: 'Order Tracking', path: '/order', text: 'Track your order' },
  { label: 'Reviews', path: '/reviews', text: 'Customer reviews' },
  { label: 'Policies', path: '/policies', text: 'Shopping & privacy policies' },
  { label: 'About Us', path: '/about', text: 'Who we are' },
  { label: 'Blog', path: '/blog', text: 'The Heritage Journal' },
  { label: 'Events', path: '/events', text: 'Events & exhibitions' },
]
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
async function get(url, options) {
  const response = await fetch(url, { ...options, headers: { 'User-Agent': 'Googlebot' } })
  return { response, html: await response.text() }
}
async function main() {
  const home = await get(base)
  assert.equal(home.response.status, 200)
  const footer = home.html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]
  assert.ok(footer, 'Homepage has a footer')
  const list = footer.match(/>Quick links<\/h2>\s*<ul\b[^>]*>([\s\S]*?)<\/ul>/)?.[1]
  assert.ok(list, 'Quick links list is present')
  const actual = [...list.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g)].map(match => ({ label: text(match[2]).trim(), path: match[1] }))
  assert.deepEqual(actual, expected.map(({ label, path }) => ({ label, path })))
  const results = await Promise.all(expected.map(async link => {
    const { response, html } = await get(base + link.path)
    assert.equal(response.status, 200, link.label)
    assert.ok(text(html).includes(link.text), `${link.label} leads to the intended page`)
    assert.ok(/<h1\b/.test(html), `${link.path} has a page heading`)
    const links = [...html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)"/g)].map(match => match[1])
    return { ...link, status: response.status, headingFound: true, internalLinks: [...new Set(links)] }
  }))
  // Check new-page action links as well as the seven quick links.
  const additional = [...new Set(results.flatMap(row => row.internalLinks))].filter(url => !expected.some(link => link.path === url))
  const actions = await Promise.all(additional.map(async url => {
    const { response } = await get(base + url)
    assert.equal(response.status, 200, `Action link ${url}`)
    return { path: url, status: response.status }
  }))
  const privacy = await get(base + '/privacy', { redirect: 'manual' })
  assert.equal(privacy.response.status, 308)
  assert.equal(privacy.response.headers.get('location'), '/policies#privacy')
  const policies = await get(base + '/policies')
  for (const id of ['orders', 'delivery', 'returns', 'product-care', 'privacy', 'contact']) {
    assert.ok(policies.html.includes(`id="${id}"`), `Policy anchor ${id}`)
  }
  const directory = path.resolve(__dirname, '../../artifacts/footer-links')
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(path.join(directory, 'after.json'), JSON.stringify({ results, actions, legacyPrivacyRedirect: { status: 308, location: '/policies#privacy' }, policyAnchorsChecked: 6 }, null, 2) + '\n')
  console.log(`PASS: all ${results.length} footer quick links and ${actions.length} additional action destinations; privacy redirect and six policy anchors.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
