# Contact form and email notifications

The Contact page posts to `/api/contact`. Valid enquiries are saved in Supabase `contact_messages` before an email is attempted. Admin → Messages lists the sender, subject, full message, timestamp and reference. Admin can search/filter, add internal notes, mark New/In progress/Resolved, refresh the inbox and open an email reply.

The notification recipient is **adireteemsmarketing@gmail.com**, configured through the server-only `CONTACT_NOTIFICATION_EMAIL` variable. The site's public contact address remains `adireteems4@gmail.com`.

## Enable email

The project has no working email-provider credentials yet. Create/configure a Resend account and add these values to `frontend/.env.local`:

```dotenv
RESEND_API_KEY=your_actual_resend_api_key
RESEND_FROM_EMAIL=Adire Teems <notifications@your-verified-domain.com>
CONTACT_NOTIFICATION_EMAIL=adireteemsmarketing@gmail.com
```

Use your actual verified sender address; the example is not a working domain. Keep the API key private and never put it in a `NEXT_PUBLIC_` variable. Restart the server after changing these values. Return to Messages and choose **Retry Email Notification** on the saved test enquiry.

Resend's default testing sender can send only to the account's allowed test recipient. To send to arbitrary recipients, verify a domain and use its sender address. A Gmail destination is fine; a Gmail address is not a domain you can verify for sending through Resend.

Set `CONTACT_NOTIFICATION_EMAIL=adireteemsmarketing@gmail.com` in the live hosting environment and redeploy to apply it. Existing messages retain their original recipient to prevent accidental redirection during retries. There is no customer auto-reply; each notification's Reply-To points to the sender of the enquiry.

## Status meanings

- **Pending**: saved, sending has not completed.
- **Not configured**: missing API key or sender; enquiry is still saved.
- **Failed**: provider rejected the request or could not be reached. Review configuration and retry.
- **Accepted**: provider returned an email ID. This is **not** confirmation of inbox delivery; check the provider dashboard for delivered/bounced events.

The implementation uses plain-text email, a ten-second network timeout and a stable provider idempotency key per enquiry. Resend's deduplication window is finite; inspect provider logs before retrying an uncertain request more than 24 hours later. There is no automatic background retry job or delivery webhook yet.

## Validation and privacy

Messages are admin-only and are excluded from `/api/store`. The API validates field lengths/email, origin, request IDs and a hidden spam field. Retries with the same submission ID do not create duplicate enquiries. Persistent per-email and overall hourly limits provide basic abuse protection; configure stronger edge rate limiting/CAPTCHA for a public deployment as appropriate. Local data needs backups and a retention policy.

Tests:

```powershell
node --test scripts/contact-email.test.cjs
node --test scripts/contact-flow.test.cjs
```

The transport test uses a mocked email provider and never sends mail. The flow test requires the local server on port 3012 and retains one clearly labelled test enquiry in the inbox. If email is configured, running the flow test can send that notification to the configured test recipient.

Supabase migration: map local statuses `new/in_progress/resolved` to the setup script's `contact_messages.status` values `new/open/closed`. Add notes and notification metadata columns when migrating this feature; the current implementation remains local.

Provider reference: https://resend.com/docs/api-reference/emails/send-email
Testing restrictions: https://resend.com/docs/api-reference/errors
