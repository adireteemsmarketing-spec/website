// Permit the configured public origin when a trusted reverse proxy forwards
// requests to localhost. Never trust arbitrary forwarded-host headers.
export function isTrustedOrigin(request: Request, appUrl = process.env.NEXT_PUBLIC_APP_URL) {
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return false
  if (origin === new URL(request.url).origin) return true
  if (!appUrl) return false
  try { return origin === new URL(appUrl).origin } catch { return false }
}
