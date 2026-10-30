# Footer link audit

All seven Quick links were tested against the local production build. No live deployment or database write was performed.

| Footer link | Destination | Before | After |
| --- | --- | --- | --- |
| FAQ | `/faq` | 200 | 200; Frequently Asked Questions |
| Order Tracking | `/order` | 404 | 200; account-protected order list |
| Reviews | `/reviews` | 404 | 200; approved customer feedback |
| Policies | `/policies` | old `/privacy` returned 404 | 200; shopping and privacy policies |
| About Us | `/about` | 200 | 200; brand story |
| Blog | `/blog` | 200 | 200; Heritage Journal |
| Events | `/events` | 404 | 200; exhibitions, lounge visits and event enquiries |

The old `/privacy` address now returns a permanent 308 redirect to `/policies#privacy`. All six policy section anchors and six additional internal action destinations found on these pages were checked successfully. The script verifies the links rendered in the homepage footer, requests their actual URLs, and checks HTTP status and page content. Evidence is saved in `artifacts/footer-links/before.json` and `artifacts/footer-links/after.json`.

## Page behavior

- Tracking reuses `OrderList` and its existing authentication and ownership checks; public visitors are prompted to sign in after hydration. Google sign-in can return to `/order`.
- Reviews reads only approved records using the anonymous Supabase client, selects no customer identifiers, and handles empty/error states. The feedback action uses the existing private contact form; no fictional testimonials are added.
- Events uses the existing brand history and lounge/contact details. Dates, venues, registration links and attendance promises are not invented.
- Policies uses the confirmed Paystack flow, separately arranged delivery, brand support details, account data and existing analytics/storage behavior. It does not invent return deadlines, prepaid labels, refund guarantees, financing or delivery estimates. Provider privacy links point to the official [Paystack terms/privacy information](https://paystack.com/terms) and [Supabase privacy information](https://supabase.com/privacy).
- FAQ copy now agrees with these actual workflows. Unsupported claims about guest checkout, PayPal/Stripe, financing, fixed delivery times, shipping calculators, automatic prepaid returns and guaranteed refunds were replaced. The search and accordion interface is retained.

## Checks

- Production build and TypeScript: passed.
- Changed application and tooling files: ESLint passed.
- 47 offline frontend tests: passed, including new tracking, approved-review, privacy-copy and OAuth-return checks.
- HTTP audit: seven quick links, six extra action destinations, the legacy privacy redirect and six policy anchors passed.
- The HTTP audit checks server-rendered destinations; it does not simulate browser clicks or signed-in customer purchases. Existing order ownership/authentication logic is reused unchanged.

Re-run after building and starting the production server on port 3017:

```powershell
cd frontend
node scripts/verify-footer-links.cjs
```

No new database migration is needed for these pages. Review before publishing.
