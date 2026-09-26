import { products, sizes, type Product } from './catalog'
export type BagItem = { productId: string; size: string; quantity: number }
export function restoreCart(value: unknown, catalog: Product[] = products): BagItem[] {
  if (!Array.isArray(value)) return []
  return value.reduce<BagItem[]>((items, item) => {
    if (!item || !catalog.some(p => p.id === item.productId) || typeof item.size !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) return items
    return addItem(items, item.productId, item.size, item.quantity, catalog)
  }, [])
}
export function addItem(items: BagItem[], productId: string, size: string, quantity: number, catalog: Product[] = products): BagItem[] {
  const product=catalog.find(p=>p.id===productId)
  if (!product || !(product.sizes || sizes).includes(size) || !Number.isInteger(quantity) || quantity < 1) return items
  if(product.availableSizes && !product.availableSizes.includes(size))return items
  const other=items.filter(i=>i.productId===productId&&i.size!==size).reduce((sum,i)=>sum+i.quantity,0)
  const limit=Math.max(0,Math.min(10,(product.inStock!==undefined ? (product.inStock?10:0) : (product.stock??0)-other)))
  if(!limit)return items
  const found = items.find(item => item.productId === productId && item.size === size)
  return found ? items.map(item => item === found ? { ...item, quantity: Math.min(limit, item.quantity + quantity) } : item) : [...items, { productId, size, quantity: Math.min(limit, quantity) }]
}
export function updateItem(items: BagItem[], id: string, size: string, quantity: number): BagItem[] {
  if (!Number.isInteger(quantity) || quantity < 0) return items
  return items.map(item => item.productId === id && item.size === size ? { ...item, quantity: Math.min(10, quantity) } : item).filter(item => item.quantity > 0)
}
