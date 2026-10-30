// Only return to customer pages, never an external URL or a staff/auth route.
export function customerReturnPath(value: string | null) {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return '/dashboard'
  if (/^\/(?:dashboard(?:\/(?:cart|orders|messages|account|addresses|history|reviews))?|checkout|cart|order|order\/[a-zA-Z0-9-]+|thank-you\/[a-zA-Z0-9-]+)$/.test(value)) return value
  return '/dashboard'
}
