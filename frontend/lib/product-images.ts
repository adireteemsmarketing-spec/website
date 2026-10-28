import { storagePath } from './storage'

export type ProductImage = { url: string; alt: string }
export const maxProductImages = 20
export const maxImageBytes = 5 * 1024 * 1024

export function productImagePath(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000 || /[\\\u0000-\u001f]/.test(value)) throw Error('Enter a valid image URL or local path.')
  const url = value.trim()
  if (!/^\/(?!\/)/.test(url) && !/^https:\/\//.test(url)) throw Error('Use a local image path or HTTPS image URL.')
  if (url.startsWith('https://')) {
    const parsed = new URL(url)
    if (parsed.username || parsed.password) throw Error('Image URLs cannot contain login details.')
  }
  return storagePath(url)
}

export function productImagePayload(value: unknown, name: string) {
  if (!Array.isArray(value) || !value.length || value.length > maxProductImages) throw Error(`Add between 1 and ${maxProductImages} product photos.`)
  const images = value.map(item => {
    if (!item || typeof item !== 'object' || typeof item.alt !== 'string' || item.alt.length > 300) throw Error('Enter valid image descriptions up to 300 characters.')
    return { path: productImagePath(item.url), alt: item.alt.trim() || name }
  })
  if (new Set(images.map(image => image.path)).size !== images.length) throw Error('Remove duplicate product photos before saving.')
  return images
}
