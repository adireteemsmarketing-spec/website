# Admin sessions and password recovery

Admin sign-in now writes a separate, HTTP-only `sb-<project>-admin-auth-token` cookie. Customer sign-in retains its existing `sb-<project>-auth-token` cookie. Every admin API checks the admin session and the current database role. Signing out affects only the selected session, not the other area or other devices. A rejected non-admin login does not replace an existing admin session.

If an admin already replaced a customer in an old browser session, refresh the app, sign out of the shop account, and sign back in as the customer once. The previous overwritten customer session cannot be reconstructed. Then sign into `/admin`; both accounts will stay separate.

## Supabase email configuration

In **Authentication → URL Configuration**, add these exact Redirect URLs:

```
https://unsnap-plug-shifty.ngrok-free.dev/reset-password
http://localhost:3000/reset-password
```

Use the public HTTPS address as Site URL while testing via ngrok. Keep ngrok and the application running. When switching to the real deployed domain, add its `/reset-password` URL as well. Recovery requests use the address of the page where the user requested the email.

In **Authentication → Email Templates → Reset Password**, keep the reset button pointed at `{{ .ConfirmationURL }}`. This lets Supabase verify and consume the emailed recovery token before redirecting to the reset page. A ready-to-copy template is in `docs/password-reset-email.html`.

In **Authentication → Email → SMTP Settings**, configure your email provider's SMTP host, port, username, password, sender email and sender name. Supabase's default email sender is restricted to authorized project-team addresses, so it does not provide general customer email delivery. The application never needs your SMTP password in the browser.

## Customer flow

1. Choose **Forgot password?** on customer or admin sign-in.
2. Enter the account email and select **Send reset link**.
3. Follow the emailed link, enter a new password twice, and select **Save new password**.
4. Sign in with the new password.

Recovery uses a separate, short-lived browser-tab session. It does not replace the shopper or admin cookies. Recovery links also work in another browser/device because they do not require a verifier saved in the requesting browser. Invalid, expired and reused links show a way to request a new link. Passwords are changed through Supabase's authenticated user API; no privileged password-reset endpoint is exposed.

## Verification

`node --env-file=frontend/.env --env-file=frontend/.env.local scripts/verify-auth-isolation.cjs`

This opt-in test creates two temporary accounts, verifies independent admin/customer sessions and recovery-token redemption, checks the new password, and deletes the accounts. It does not send email. Actual inbox delivery must be checked after configuring SMTP.

References: [Supabase email delivery](https://supabase.com/docs/guides/auth/auth-smtp), [password-reset API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).
