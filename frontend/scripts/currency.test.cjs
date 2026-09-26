const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/currency.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = { exports: {} }
new Function('module', 'exports', code)(loaded, loaded.exports)
const { formatPrice, validRates, currencies } = loaded.exports
test('converts USD base prices once, with two decimal places and explicit currency', () => {
  for (const [currency, rate, expected] of [['USD', 1, '75.00'], ['NGN', 1325.86, '99,439.50'], ['GBP', .74015, '55.51'], ['EUR', .86428, '64.82']]) {
    assert.ok(formatPrice(75, currency, rate).includes(expected))
    assert.ok(formatPrice(75, currency, rate).includes(currency))
    assert.ok(formatPrice(0, currency, rate).includes('0.00'))
  }
})
test('rejects incomplete, zero, negative and non-finite rate snapshots', () => {
  const snapshot = { date: '2026-09-15', rates: { USD: 1, NGN: 1325.86, GBP: .74015, EUR: .86428 } }
  assert.equal(validRates(snapshot), true)
  for (const currency of currencies) for (const invalid of [undefined, 0, -1, Infinity, '1']) {
    assert.equal(validRates({ ...snapshot, rates: { ...snapshot.rates, [currency]: invalid } }), false)
  }
  assert.equal(validRates(null), false)
  assert.equal(validRates({ ...snapshot, date: 'invalid' }), false)
})
