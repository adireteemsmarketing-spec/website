import type { Product } from './catalog'

export type SeoProduct = Pick<Product, 'name' | 'fabric' | 'style' | 'description' | 'metaDescription'>
const clean = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim()

// Use only recorded attributes. Never infer materials, occasions or availability.
export function generatedProductDescription(product: SeoProduct) {
  const name = clean(product.name)
  const details = [...new Set([clean(product.fabric), clean(product.style)])]
    .filter(value => value && !/^(other|others|original|not specified|n\/a)$/i.test(value) && !name.toLowerCase().includes(value.toLowerCase()))
  const base = `Shop ${name} from Adire Teems${details.length ? `, featuring ${details.join(' and ')}` : ''}.`
  const endings = [
    ' Explore the product details and discover a piece to complement your wardrobe and personal style.',
    ' Explore the product details and find your next wardrobe addition.',
    ' View the product details and explore your style options.',
    ' Explore the details and plan your next look.',
    ' View the product details.',
    '',
  ]
  const candidates = endings.map(ending => base + ending)
  return candidates.find(value => value.length >= 140 && value.length <= 160)
    || candidates.filter(value => value.length <= 160).sort((a, b) => b.length - a.length)[0]
    || base // Preserve long product names rather than cutting a word or inventing a shorter name.
}

export function productDescription(product: SeoProduct) {
  return product.metaDescription?.trim() ? product.metaDescription : generatedProductDescription(product)
}
