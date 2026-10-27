# Product SEO review — Adire Teems

Prepared on 27 October 2026 on branch `feat/product-meta-descriptions`. Nothing has been deployed or written to the live product database. The earlier, uncommitted Google sign-in work remains present and was not replaced.

## Results

| Measure | Result |
| --- | ---: |
| Products audited, including archived records | 102 |
| Published products | 63 |
| Existing saved descriptions preserved exactly | 101 |
| New descriptions prepared for blank fields | 1 |
| Published products without a description before | 1 |
| Published products without a description after the proposal/fallback | 0 |
| Exact duplicate descriptions | 0 |
| Substantially similar description pairs | 0 |
| Products flagged for editorial review | 96 |
| Published products flagged for editorial review | 57 |
| Products with missing source attributes requiring confirmation | 0 |

Of the existing descriptions, 95 omit the full product name and five are shorter than 140 characters. Four products have both issues, so 96 distinct products need editorial review. These descriptions were preserved, as requested, rather than automatically rewritten. The generated description is 140 characters. All existing nonblank values are treated as manually saved copy because the database has no reliable manual/generated provenance marker.

`before.json` is the read-only Supabase snapshot and backup of the relevant product fields. `proposal.json` records every product's before/after description, character count, source, and flags. `review.json` contains names, IDs/SKUs, missing information, reasons for review, and safe alternative descriptions for editorial consideration. Alternatives are not automatically applied. `duplicates.json` records exact and near-duplicate findings; near-duplicates use case-insensitive word-set Jaccard similarity of at least 0.8. This lexical check does not replace a human assessment of meaning or tone.

## Architecture and implementation

The frontend is Next.js 16.3.1 with the App Router and React 19. Product pages are dynamic at `/product/[slug]` and use Supabase `public.products`, through `readStore`. The existing product table already contains `meta_description`, `seo_title`, `canonical_url`, and `noindex`; there was no product-level metadata export or admin field exposing these descriptions. Product pages previously inherited the generic site description from the root layout.

Changed/new implementation files:

- `frontend/lib/product-seo.ts`: uses saved descriptions verbatim; only empty/whitespace-only descriptions receive a fallback generated from the recorded name, fabric and style. No inferred price, stock, delivery, origin, occasion, or quality claims. Double quotation marks and markup are removed from generated copy; saved copy is escaped by Next.js rather than rewritten. Long names remain intact and unusual lengths are flagged.
- `frontend/lib/catalog.ts` and `frontend/lib/store-db.ts`: map existing database SEO fields into the product model.
- `frontend/app/product/[slug]/page.tsx`: uses `generateMetadata` with awaited route parameters; caches the shared published-product read within a request. Sets the product description and Open Graph description, uses the saved SEO title/canonical where present, otherwise a product title and production canonical, and respects noindex. Other inherited Open Graph and alternate metadata is retained.
- `frontend/components/admin-console.tsx`: editable Meta Description textarea, live character count, and explanation of the optional fallback. Unrelated SEO fields are excluded from the generic form.
- `frontend/app/api/admin/store/route.ts`: validates and passes explicitly supplied descriptions into the existing atomic catalogue-save RPC. Omitted fields remain omitted, preserving descriptions from older clients.
- `supabase/07_product_meta_descriptions.sql`: repeatable, transaction-wrapped migration to extend the existing catalogue-save function. Existing metadata survives omitted fields; an explicit empty value clears the field to enable fallback. Inventory, variants, permissions, images, and non-SEO product data retain the existing behavior. The column addition is conditional because the schema already includes it.
- `supabase/tests/verify.mjs` and `frontend/tests/product-seo.test.cjs`: migration, manual preservation, old-client compatibility, explicit clearing, Unicode/HTML escaping, fallback, routing, and metadata regression checks.
- `frontend/scripts/audit-product-seo.cjs` and `frontend/scripts/verify-product-seo-html.cjs`: reproducible read-only audit and rendered-HTML validation.

The migration and `backfill.sql` are prepared only. The backfill targets the one blank description and checks its audited timestamp before updating it. `rollback.sql` restores its previous value only if the generated value is still present, preserving later manual edits.

## Before and after examples

**Indigo Cotton Adire Fabric with White Line Patterns** (`Ind-patt001`):

- Saved field before: empty.
- Proposed saved field / rendered fallback: Shop Indigo Cotton Adire Fabric with White Line Patterns from Adire Teems. Explore the product details and find your next wardrobe addition.
- Length: 140 characters. The full name and its cotton, indigo, and white-pattern attributes come from the product record.

**Bright Blue Beaded Adire Jacket**:

- Saved field before and after, unchanged: A bright blue jacket with geometric beading and contrasting vertical details. The collarless front gives this statement piece a clean, structured look.
- Rendered page before this implementation: the generic root-layout mission description.
- Rendered page after: the existing saved description above. The title remains the stored SEO title and the canonical is the product URL.

## Verification

- 39 offline frontend tests passed, covering existing cart, styles, currency, exchange rates, contact email, storefront, password recovery, Google auth, request-origin and Paystack behavior as well as the new SEO tests.
- PostgreSQL/PGlite suite passed, including all existing integration/ownership/payment checks, repeatable migration application, Unicode text, preservation on old-client saves, and explicitly clearing a description. No production database was used for mutation tests.
- TypeScript and `npm run build` passed.
- Targeted ESLint on all changed SEO application/tooling files passed.
- Full `npm run lint` ran and failed with 79 existing errors and 20 warnings, recorded in `lint-full.json`. These are four unescaped-entity errors in the unchanged FAQ and existing CommonJS test-harness import/module rules, including the earlier Google auth test. No new SEO files have lint errors. These unrelated issues were not suppressed or rewritten.
- Four product pages were fetched from the local production build with Googlebot's user agent and their actual returned HTML inspected. All returned HTTP 200, exactly one description tag, matching saved/fallback descriptions, correct title, correct canonical, and matching Open Graph description. Details and literal tags are in `render-validation.json`.
- Samples include the new fallback, existing saved copy, a product title with an apostrophe, and another product URL. Descriptions differ across product routes. Separate unit tests verify Unicode Nigerian names, apostrophes, ampersands and quotation marks. Interactive browser client-side navigation was not separately automated.
- There was no existing product JSON-LD implementation in the product page or component. The sampled pages contain zero product structured-data tags before/after this source change; none was removed or altered.
- Network-dependent admin/contact write-flow scripts were not run against production: they create products, accounts, enquiries or other records. Their relevant data boundaries were exercised by the local PostgreSQL suite instead.

## Editing descriptions after approval

1. Apply the reviewed `supabase/07_product_meta_descriptions.sql` migration in Supabase first.
2. Review the one proposed update in `artifacts/product-seo/backfill.sql`. Apply it only after approval. If its timestamp condition no longer matches, re-audit the current product instead of forcing an overwrite.
3. Review and deploy the code only after authorization. Full-repository lint still needs the unrelated issues above resolved or explicitly accepted in the release review.
4. Open **Admin → Products → Edit → Meta Description**. Enter the description, watch the character count, then save/publish the product. Aim for 140–160 characters, but preserve natural English and verified facts.
5. Leave the field blank to use the generated fallback. Editing another product field preserves a saved description; fallback is not substituted into a nonblank manually saved field.
6. Inspect `/product/<slug>` after saving. The metadata reflects the saved description dynamically; no product-specific rebuild is required.

The live database and website remain unchanged pending review and approval.
