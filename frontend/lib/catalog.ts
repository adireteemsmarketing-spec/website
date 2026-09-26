export type Product = {
  id: string; name: string; slug: string; price: number; image: string
  images?: { url: string; alt: string }[]
  currency?: string; inStock?: boolean; availableSizes?: string[]
  category: string
  styleGroup?: string; style?: string
  fabric: string; description: string; badge?: 'Bestseller' | 'New'
  department?: string; stock?: number; sizes?: string[]; status?: 'published' | 'draft'; sku?: string
}

export const products: Product[] = [
  { id: '1', name: 'Adire Collection Gown', slug: 'adire-collection-gown', price: 850, category: 'dresses', fabric: 'Adire', description: 'Hand-dyed Silk', badge: 'Bestseller', image: '/images/Edited picture for kaldoni/Bubu gown/Adire bubu/adire-teems-adire-bubu-blue-front.png' },
  { id: '2', name: 'Tailored Adire Set', slug: 'tailored-adire-set', price: 920, category: 'sets', fabric: 'Adire', description: 'Structured Cotton Canvas', image: '/images/Edited picture for kaldoni/Womens 2 piece/adire-teems-cotton-2-piece-mustard.jpg.png' },
  { id: '3', name: 'Modern Tunic Dress', slug: 'modern-tunic-dress', price: 680, category: 'dresses', fabric: 'Aso Oke', description: 'Lightweight Linen Blend', badge: 'New', image: '/images/Edited picture for kaldoni/Jumpsuit/adire-teems-jumpsuit-multicolour-women.jpg.png' },
  { id: '4', name: 'Adire Print Kimono', slug: 'adire-print-kimono', price: 750, category: 'robes', fabric: 'Adire', description: 'Silk Charmeuse', image: '/images/Edited picture for kaldoni/Kimono/adire kimono/adire-teems-adire-kimono-blue.women.png' },
  { id: '5', name: 'Patterned Short Set', slug: 'patterned-short-set', price: 520, category: 'sets', fabric: 'Adire', description: 'Heavyweight Cotton', badge: 'Bestseller', image: '/images/Edited picture for kaldoni/Womens 2 piece/adire-teems-chiffon-2-piece-set-green.jpg.png' },
  { id: '6', name: 'Agbada Adire Robe', slug: 'agbada-adire-robe', price: 620, category: 'robes', fabric: 'Adire', description: 'Premium Cotton Blend', image: '/images/Edited picture for kaldoni/Male 2 piece/adire-teems-2-piece-beige-men.jpg.png' },
  { id: '7', name: 'Striped Kaftan', slug: 'striped-kaftan', price: 710, category: 'robes', fabric: 'Aso Oke', description: 'Hand-woven Linen', image: '/images/Edited picture for kaldoni/Bubu gown/chiffon bubu/adire-teems-chiffon-bubu-multicolour.png' },
  { id: '8', name: 'Lounge Suit', slug: 'lounge-suit', price: 890, category: 'sets', fabric: 'Others', description: 'Soft Cotton Silk', image: '/images/Edited picture for kaldoni/Male 2 piece/adire-teems-2-piece-green-men.jpg.png' },
  { id: '9', name: 'Graffiti Print Top', slug: 'graffiti-print-top', price: 540, category: 'accessories', fabric: 'Adire', description: 'Woven Jacquard', image: '/images/Edited picture for kaldoni/Jacket/adire-jacket-blue-beaded-front.jpg.png' },
  { id: '10', name: 'O-Ring Two Piece', slug: 'o-ring-two-piece', price: 780, category: 'sets', fabric: 'Others', description: 'Printed Crepe', image: '/images/Edited picture for kaldoni/Womens 2 piece/adire-teems-womens-maroon-soft-cotton-2-piece-set-front.jpg.png' },
]


export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const money = (value: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
