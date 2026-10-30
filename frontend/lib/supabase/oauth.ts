// Only return to customer pages, never an external URL or a staff/auth route.
export function publicAuthOrigin(requestUrl: string, appUrl = process.env.NEXT_PUBLIC_APP_URL) {
  const requested = new URL(requestUrl)
  const configured = new URL(appUrl || 'https://adireteems.com')
  const baseHost = configured.hostname.replace(/^www\./, '')
  if (requested.origin === configured.origin || (requested.protocol === configured.protocol && requested.port === configured.port && [baseHost, `www.${baseHost}`].includes(requested.hostname))) return requested.origin
  return configured.origin
}

export function customerReturnPath(value: string | null) {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return '/dashboard'
  if (/^\/(?:dashboard(?:\/(?:cart|orders|messages|account|addresses|history|reviews))?|checkout|cart|order|order\/[a-zA-Z0-9-]+|thank-you\/[a-zA-Z0-9-]+)$/.test(value)) return value
  return '/dashboard'
}
