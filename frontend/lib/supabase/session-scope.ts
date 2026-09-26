// Keep the existing shopper cookie for compatibility. Staff uses a separate namespace.
export function adminCookieName(url: string) {
  return `sb-${new URL(url).hostname.split('.')[0]}-admin-auth-token`
}
