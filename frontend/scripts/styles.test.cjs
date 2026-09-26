const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/styles.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = { exports: {} }
new Function('module', 'exports', code)(loaded, loaded.exports)
const { matchesStyle, validStyle, styleGroups } = loaded.exports
test('group selection includes its styles; individual selection narrows results', () => {
  const products = [{styleGroup:'Dress',style:'Spaghetti'}, {styleGroup:'Dress',style:'Corporate dress'}, {styleGroup:'Bubu',style:'Damask bubu'}, {}]
  assert.equal(products.filter(p=>matchesStyle(p,'','')).length,4)
  assert.equal(products.filter(p=>matchesStyle(p,'Dress','')).length,2)
  assert.equal(products.filter(p=>matchesStyle(p,'Dress','Spaghetti')).length,1)
  assert.equal(products.filter(p=>matchesStyle(p,'Bubu','Spaghetti')).length,0)
})
test('all configured styles are valid, unique, and restricted to their group', () => {
  assert.equal(styleGroups.length,6)
  for(const group of styleGroups) {
    assert.equal(new Set(group.styles).size,group.styles.length)
    for(const style of group.styles) assert.equal(validStyle(group.name,style),true)
  }
  assert.equal(validStyle('',''),true)
  assert.equal(validStyle('Bubu','Spaghetti'),false)
  assert.equal(validStyle('Unknown',''),false)
  assert.equal(validStyle('','Spaghetti'),false)
})
