# Security review and hardening — 30 October 2026

## Scope and Git integration

Reviewed the Next.js storefront/admin API, Supabase authorization boundaries, payment verification, uploads, OAuth callbacks, Python backend and dependency manifests. Incorporated the existing remote Next.js security-version commit and the previously completed footer-page commit into local `main` before making these changes. This is an application review with automated local checks, not a penetration test of the production hosting account.

## Verified issues addressed

1. **Dependency/lockfile mismatch:** remote `main` declared Next.js 16.4.1 but the lockfile and installed application still used 16.3.1. Updated the installed framework and lockfile to 16.4.1, React/React DOM to 19.2.9 and matching ESLint configuration. Applied compatible dependency fixes. Moved the shadcn generator out of production dependencies into development tools.
2. **Unbounded request allocation:** JSON, raw webhook and upload bodies were previously parsed or fully buffered before size checks, or had no body limit. Added a shared streaming byte-limited reader. The app now rejects oversized input with 413 while reading, validates JSON media type/object shape, and bounds multipart bodies before parsing. Existing 5 MB photo limits remain; uploads allow a small multipart overhead. Webhook signature verification still uses the original decoded UTF-8 body and remains required before privileged database access.
3. **Callback host trust:** Google callbacks previously used the request URL's origin on public hosts. Redirect origins are now limited to the configured application origin and its www/non-www alias, with a fixed production-domain fallback. The existing customer return-path allowlist remains enforced.
4. **Browser protections:** added nosniff, frame denial, strict referrer policy, restricted camera/microphone/geolocation permissions, production HSTS and a baseline CSP preventing object embedding, cross-origin base URLs and framing. Removed the framework identification header. APIs receive private/no-store caching defaults. This deliberately does not claim a complete nonce-based script CSP; existing analytics and Next.js inline scripts continue to work.
5. **Admin cookies:** explicitly mark the separate HTTP-only staff cookie Secure in production. Existing SameSite=Lax and customer/admin session separation are retained.
6. **Privileged legacy AI endpoints:** the Python chat/conversation routes previously accepted public requests while using a service-role database client and a paid AI provider. All three now require a private server-to-server bearer token, compared in constant time. Missing authorization returns 401; an unconfigured token fails closed. The storefront does not call these legacy routes. A trusted gateway must enforce customer ownership before using this privileged interface.
7. **Internal error disclosure:** Python's global error middleware previously returned exception text unconditionally. Clients now receive only a generic message; details stay in server logs. Replaced wildcard credentialed development CORS with explicit loopback origins.
8. **Known Python dependency risks:** updated python-multipart from 0.0.6 to 0.0.32. Removed the unused JWT/password helper and its python-jose/passlib dependencies; there were no application imports or mounted authentication routes using that helper. Customer/staff sign-in continues through Supabase. The old JWT helper was not replaced with a new token issuer.
9. **Test isolation:** backend tests now use synthetic configuration and mocked catalogue access, rather than accepting server errors as success or potentially using merchant credentials. Node CommonJS test tooling now has appropriately scoped lint rules; browser/application rules remain enabled.

## Verification results

- **51 frontend tests passed**, covering request size limits with/without Content-Length, UTF-8 byte accounting, malformed JSON/media types, multipart preservation, raw webhook text, redirect host protection and existing customer/payment/product/footer flows.
- **17 Python tests passed** after the multipart update and removal of legacy authentication dependencies, including unauthenticated AI denial, fail-closed configuration, correct/incorrect gateway tokens and generic error output.
- **PostgreSQL/PGlite suite passed:** 47 tables have RLS, with negative role/ownership checks, isolated carts/orders, price integrity, inventory reservations, payment signature/settlement boundaries and late-payment handling. No production mutation was used.
- **Full frontend lint passed with zero errors**; 27 warnings remain, primarily existing image/performance/style warnings and redundant tooling directives.
- **Production build and TypeScript passed** on patched Next.js. The first sandboxed build could not retrieve Google Fonts; an unrestricted build passed. The final production output is rebuilt after that failed attempt.
- **19 read-only HTTP security checks passed** against the patched production build: required headers; denied anonymous admin/order/cart reads; no-store on sensitive API responses; malformed/oversized login input; cross-site POST rejection; unsigned/oversized webhook rejection; safe OAuth error redirection. No brute-force attempts, real payments or customer writes were made.
- **npm production audit: zero known vulnerabilities.** Full npm audit reports three low-severity development-only findings in deepmerge and its shadcn dependency chain; no moderate/high/critical npm findings remain. A forced downgrade of the development generator was not applied.
- A tracked-file check found no matches for the checked live Paystack/Supabase secret and private-key patterns. Environment files are ignored; this was not a complete historical secret scan or proof that credentials have never been exposed.

Evidence: `artifacts/security/npm-production.json`, `npm-full.json`, `lint.json` and `http-checks.json`. Re-run the HTTP checks with the production server on port 3018 using `node frontend/scripts/verify-security-http.cjs`.

## Remaining operational work and limits

- **Complete Python dependency auditing remains unverified:** pip-audit was installed and attempted with dependency resolution and with pinned direct requirements. The advisory service failed to resolve `pypi.org`; the stalled resolver was stopped. Known multipart/JWT issues were checked separately against maintainer advisories, but there is no clean full/transitive Python audit claim. Re-run `pip-audit -r backend/requirements.txt` from a network that can reach its advisory service.
- **Runtime patching is separate from package patching.** This machine ran Node 22.18.0 and Python 3.11.9; their system installations were not changed. `.nvmrc` requests patched Node 22.23.4. Update local/deployed Node to a supported patched release and update the deployed Python patch level. Confirm the actual runtime on the hosting platform; a Git merge alone does not patch it.
- Set `NEXT_PUBLIC_APP_URL` to the actual public HTTPS site in production. The local project has historically used an ngrok URL; do not copy that into production. HSTS and Secure cookies require correct HTTPS hosting.
- Only if the Python AI backend is used: configure a random `AI_GATEWAY_TOKEN` of at least 32 characters on that backend and its trusted server caller. Never place it in browser code or a `NEXT_PUBLIC_` variable. Without it, the AI routes stay closed. Supabase storefront functionality is independent of this token.
- Hosting WAF/rate limits, request timeouts, deployed RLS/migration state, staff MFA, backups and secret rotation were not changed or asserted verified by this source review. Supabase authentication and database contact-admission controls remain in place; local byte limits are not a distributed abuse-rate limiter.
- No production database migration or manual production deployment was run. The requested integration is a Git commit/push to `main`; any hosting automation triggered by that branch is managed by the connected hosting platform.

## Primary references

- [Next.js October security fixes](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
- [Next.js response-header configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [Node.js October security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- [python-jose advisory](https://github.com/advisories/GHSA-3qf3-8w2g-rqmx)
- [python-multipart parser advisory](https://github.com/advisories/GHSA-6jv3-5f52-599m)
