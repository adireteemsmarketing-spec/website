# Google customer sign-in

The customer sign-in and registration forms offer **Continue with Google**, alongside email/password. Supabase handles Google authentication using PKCE; `/auth/callback` exchanges the one-time code into the existing customer cookie. Shoppers return to checkout or their original customer page. The existing guest bag is merged into their account on return. Staff sign-in retains its separate session and role checks.

## Activate in Google and Supabase

1. In [Google Auth Platform](https://console.cloud.google.com/auth/overview), create or select the Adire Teems project. Set branding/support email to `adireteemsmarketing@gmail.com`. Configure an external audience, and the `openid`, email, and profile scopes. Publish the app for customers; while in Testing, only listed test users can use it.
2. Create an OAuth client with application type **Web application**. Add these authorized JavaScript origins:
   - `https://adireteems.com`
   - `https://www.adireteems.com`
   - `http://localhost:3000` for local development
3. Add this exact **Authorized redirect URI** in Google:
   `https://esrotmfwepjzifqtxsvk.supabase.co/auth/v1/callback`
4. In Supabase **Authentication → Sign In / Providers → Google**, enable Google, paste the client ID and client secret from Google, and save. Keep the secret in Supabase; it does not belong in frontend code or a public environment variable.
5. In Supabase **Authentication → URL Configuration**, set Site URL to `https://adireteems.com`. Add the following redirect URLs, preserving the existing password reset URLs:
   - `https://adireteems.com/auth/callback**`
   - `https://www.adireteems.com/auth/callback**`
   - `http://localhost:3000/auth/callback**`
   The suffix allows the callback's `?next=...` return-page parameter. For tunnel testing, add the tunnel origin in Google and its `/auth/callback**` URL in Supabase.
6. Ensure the production hosting environment sets `NEXT_PUBLIC_APP_URL=https://adireteems.com`, then deploy the website changes. The local environment currently points to an ngrok tunnel; do not copy that value into production.

## Verify

Choose Continue with Google from `/dashboard` and complete consent with a new customer. Check the name/email and sign out. Then add an item while signed out, sign in from checkout, and check that the bag and checkout remain available. Verify existing email/password sign-in still works, cancellation shows the retry page, and customer Google sign-in does not grant access to admin pages.

Automated checks: `node --test frontend/tests/google-auth.test.cjs frontend/tests/auth.test.cjs`.

Reference: [Supabase Google sign-in documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).
