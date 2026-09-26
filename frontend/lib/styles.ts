import type { Product } from './catalog'

export const styleGroups = [
  { name: 'Dress', styles: ['Spaghetti', 'Alter neck', 'Corporate dress'] },
  { name: 'Bubu', styles: ['Cotton long bubu', 'Cotton short bubu', 'Chiffon short bubu', 'Damask bubu', 'Micado bubu', 'Aso Oke bubu'] },
  { name: 'Pants', styles: ['Aso Oke pant', 'Ankara pant', 'Akwete pant', 'Adire pant'] },
  { name: 'Sets', styles: ["Men’s Adire 2 piece", "Men’s Aso Oke 2 piece", 'Kids 2 piece', "Women’s Adire 2 piece", "Women’s Aso Oke 2 piece"] },
  { name: 'Jacket', styles: ['Aso Oke jacket', 'Akwete jacket', 'Beaded jacket', 'Winter jacket', 'Adire jacket', 'Kimono'] },
  { name: 'Shirts', styles: ['T-shirts', 'Mens shirt', 'Ladies top', 'Aso Oke shirt'] },
]

export function validStyle(group: string, style: string) {
  if (!group) return !style
  const entry = styleGroups.find(item => item.name === group)
  return !!entry && (!style || entry.styles.includes(style))
}

export function matchesStyle(product: Pick<Product, 'styleGroup' | 'style'>, group: string, style: string) {
  return (!group || product.styleGroup === group) && (!style || product.style === style)
}
