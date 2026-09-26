const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
function load(file) {
  const filename = path.resolve(__dirname, '../lib', file + '.ts')
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => load(name.replace('./', '')), module, module.exports)
  return module.exports
}
const { addItem, updateItem, restoreCart } = load('cart-state')
test('admin catalogue accepts new products and enforces shared inventory',()=>{
 const catalog=[{id:'admin-new',sizes:['One size','L'],stock:3}]
 let items=addItem([],'admin-new','One size',2,catalog)
 items=addItem(items,'admin-new','L',5,catalog)
 assert.equal(items.reduce((sum,item)=>sum+item.quantity,0),3)
 assert.deepEqual(addItem([],'admin-new','One size',1,[{...catalog[0],stock:0}]),[])
 assert.equal(restoreCart(items,[{...catalog[0],stock:1}]).reduce((sum,item)=>sum+item.quantity,0),1)
})
test('same product and size merge, different sizes stay separate', () => {
  let items = addItem([], '1', 'M', 2)
  items = addItem(items, '1', 'M', 3)
  items = addItem(items, '1', 'L', 1)
  assert.deepEqual(items, [{productId:'1',size:'M',quantity:5},{productId:'1',size:'L',quantity:1}])
})
test('quantity changes respect cap and removal', () => {
  let items = addItem([], '1', 'M', 9)
  assert.equal(addItem(items, '1', 'M', 9)[0].quantity, 10)
  items = updateItem(items, '1', 'M', 2)
  assert.equal(items[0].quantity, 2)
  assert.deepEqual(updateItem(items, '1', 'M', 0), [])
})
test('saved cart roundtrips and discards invalid entries', () => {
  const items = addItem([], '2', 'XL', 3)
  assert.deepEqual(restoreCart(JSON.parse(JSON.stringify(items))), items)
  assert.deepEqual(restoreCart([null, {}, {productId:'missing',size:'M',quantity:1}, {productId:'1',size:'M',quantity:-1}, {productId:'1',size:'M',quantity:1.5}]), [])
  assert.deepEqual(restoreCart({}), [])
})
test('invalid additions and updates do not damage cart', () => {
  const items = addItem([], '1', 'S', 1)
  assert.deepEqual(addItem(items, '1', 'invalid', 1), items)
  assert.deepEqual(updateItem(items, '1', 'S', NaN), items)
})
