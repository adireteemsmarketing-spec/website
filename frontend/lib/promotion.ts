export type Promotion = { title: string; description: string; image: string; linkLabel: string; linkUrl: string; published: boolean }
export const emptyPromotion: Promotion = { title: '', description: '', image: '', linkLabel: '', linkUrl: '', published: false }

export function safePromoUrl(value: string) {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return false
  if (/^\/(?!\/)/.test(value)) return true
  try { return new URL(value).protocol === 'https:' } catch { return false }
}

export function validatePromotion(value: unknown): Promotion {
  if (!value || typeof value !== 'object') throw Error('Enter promotion details.')
  const data = value as Record<string, unknown>
  const result = { ...emptyPromotion }
  for (const [key, max] of [['title', 150], ['description', 2000], ['image', 2000], ['linkLabel', 80], ['linkUrl', 2000]] as const) {
    if (typeof data[key] !== 'string' || data[key].length > max) throw Error(`Enter a valid ${key}.`)
    result[key] = data[key].trim()
  }
  if (typeof data.published !== 'boolean') throw Error('Choose whether to publish the promotion.')
  result.published = data.published
  if (result.published && !result.title) throw Error('Add a heading before publishing.')
  if (result.image && !safePromoUrl(result.image)) throw Error('Use a local path or HTTPS image URL.')
  if (Boolean(result.linkLabel) !== Boolean(result.linkUrl)) throw Error('Provide both button text and a button link, or leave both blank.')
  if (result.linkUrl && !safePromoUrl(result.linkUrl)) throw Error('Use a local path or HTTPS button link.')
  return result
}
