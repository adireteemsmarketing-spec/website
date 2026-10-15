// Next may expose an internal request URL behind a reverse proxy. The Host
// header still identifies the requested site; forwarded-host is not trusted.
export function isTrustedOrigin(request: Request, appUrl = process.env.NEXT_PUBLIC_APP_URL) {
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return false
  try {
    const source = new URL(origin)
    if (!['http:', 'https:'].includes(source.protocol) || source.origin !== origin) return false
    if (origin === new URL(request.url).origin) return true
    const host = request.headers.get('host')
    if (host && source.host === host.toLowerCase()) return true
    return Boolean(appUrl && origin === new URL(appUrl).origin)
  } catch { return false }
}
