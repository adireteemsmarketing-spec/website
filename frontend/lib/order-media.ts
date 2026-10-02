import { mediaUrl } from './storage'

export type OrderMediaItem = {
  product_name: string
  product_variants?: { products: { slug: string; product_images: { storage_path: string; alt_text: string | null; sort_order: number }[] } | null } | null
}

export function orderItemMedia(item: OrderMediaItem) {
  const product = item.product_variants?.products
  return {
    productUrl: product?.slug ? `/product/${encodeURIComponent(product.slug)}` : null,
    images: [...(product?.product_images || [])].sort((a, b) => a.sort_order - b.sort_order).map(image => ({ url: mediaUrl(image.storage_path), alt: image.alt_text || item.product_name })),
  }
}
