Adire Teems — AI-Powered Smart E-commerce Website: Technical PRD
1. Product Overview
Product: AI-powered smart e-commerce platform for Adire Teems, enabling customers to browse, get AI-assisted product guidance, and purchase Adire fabric/apparel, while giving the business a dashboard to manage products, orders, customers, and inventory.
Business goals: Convert browsers into buyers through AI-guided shopping, reduce manual inventory/order overhead, and give Adire Teems full ownership of a scalable platform after handover.
Users:
Customers — browse, chat with AI assistant, purchase, track orders, manage account
Admin/Staff — manage catalogue, orders, inventory, view sales
AI Assistant (system actor) — reads product/inventory data, responds to shopping queries, assists checkout

2. Tech Stack
Layer
Choice
Notes
Frontend + App Framework
Next.js 14+ (App Router, TypeScript)
Storefront, checkout UI, admin dashboard UI, server actions/API routes
Styling
Tailwind CSS + shadcn/ui
Fast, consistent, easy to theme to Adire brand colors
Database
Supabase (Postgres)
Products, orders, customers, inventory, categories
Auth
Supabase Auth
Email/password + optional Google OAuth for customers; separate role-gated admin login
Storage
Supabase Storage
Product images, brand assets
Realtime
Supabase Realtime
Live stock counts, live order status on admin dashboard
AI/Logic Service
Python (FastAPI) hosted on Render
AI shopping assistant, recommendation logic, retrieval over product catalogue
LLM Provider
OpenAI API (GPT-4o / GPT-4o-mini)
Chat assistant + function calling for product lookups
Payments
Paystack (primary), Flutterwave (fallback)
Both integrated server-side with webhook verification
Hosting (Next.js)
Vercel
CI/CD from GitHub, edge-friendly
Hosting (Python)
Render
Web service + background worker if needed
Notifications
Resend or Supabase Edge Functions + email provider
Order confirmations, admin alerts
Version Control/CI
GitHub + Vercel/Render auto-deploy on push



Why this split: Next.js handles everything UI + standard CRUD via Supabase directly (fast, fewer moving parts). Python is reserved for what it's actually needed for — LLM orchestration, retrieval-augmented product search, and any recommendation/business logic too heavy or awkward for edge functions. This keeps the Next.js app simple and keeps the AI service independently scalable/deployable.

3. System Architecture
┌─────────────────────┐        ┌──────────────────────────┐
│   Next.js (Vercel)  │◄──────►│  Supabase (Postgres, Auth,│
│  Storefront + Admin │        │  Storage, Realtime)        │
└──────────┬───────────┘        └──────────────┬────────────┘
           │  REST call (assistant queries)     │ direct queries
           ▼                                    │ (service role,
┌─────────────────────┐                         │  read-only where
│  FastAPI (Render)    │◄────────────────────────┘  possible)
│  AI Assistant Service│
│  - OpenAI integration │
│  - Product retrieval  │
│  - Recommendation logic│
└──────────┬────────────┘
           │
           ▼
   ┌───────────────┐
   │  OpenAI API    │
   └───────────────┘

Payments: Next.js server routes ↔ Paystack/Flutterwave APIs ↔ webhooks → Supabase (orders table)

Key architectural decisions:
Next.js talks to Supabase directly for all standard storefront/admin CRUD (no need to proxy through Python).
The FastAPI service is stateless per-request; it reads product/inventory data from Supabase (via a scoped service key) to ground the AI's answers — this avoids the AI hallucinating prices/stock.
Payment webhooks land on Next.js API routes (/api/webhooks/paystack, /api/webhooks/flutterwave), verify signatures, then update Supabase — this is the single source of truth for order state.
Paystack is tried first at checkout; if it's unavailable/fails, the UI offers Flutterwave without the customer losing cart state.

4. Data Model (Supabase / Postgres)
Core tables (columns abbreviated — full DDL to be written in Phase 1):
profiles — extends auth.users; role (customer / admin / staff), name, phone
categories — id, name, slug, parent_id (for sub-categories)
products — id, name, slug, description_short, description_long, category_id, base_price, is_featured, status
product_variants — id, product_id, size, color, sku, price_override, stock_qty
product_images — id, product_id, storage_path, sort_order
inventory_logs — id, variant_id, change_qty, reason (sale, restock, manual_adjustment), created_by, created_at
orders — id, customer_id, status, subtotal, delivery_fee, total, currency, payment_provider, payment_reference, created_at
order_items — id, order_id, variant_id, qty, unit_price
addresses — id, customer_id, address fields
carts / cart_items — for persisted cart (or client-side + sync on auth)
ai_conversations — id, customer_id (nullable for guests), session_id
ai_messages — id, conversation_id, role, content, created_at
Row Level Security: customers can only read/write their own orders/cart/profile; admins/staff get elevated policies scoped by role; the AI service uses a service-role key restricted to read-only on products, product_variants, categories.

5. Development Phases & Master Prompts
Each phase below maps to the contract's 5-week plan but is broken into buildable technical units. Each has a master prompt — paste this into Claude Code (or your AI coding tool of choice) at the start of that phase, adjusting the [bracketed] parts as needed.
Phase 0 — Project Foundation & Setup
Goal: Repo, Supabase project, environment wiring, base schema, deployment pipeline live before any feature work.
Deliverables:
Next.js + TypeScript + Tailwind + shadcn/ui scaffolded, deployed to Vercel (even as a blank page)
Supabase project created; core schema (Section 4) migrated via SQL migrations
Supabase Auth configured (email/password, roles)
FastAPI service scaffolded, deployed to Render with a health-check endpoint
.env structure defined for both services (never commit secrets)
GitHub repo with CI: lint + typecheck on push
Master Prompt — Phase 0:
You are setting up the foundation for Adire Teems, an AI-powered e-commerce
platform. Build the initial project scaffold with these requirements:

1. Create a Next.js 14 App Router project with TypeScript, Tailwind CSS, and
   shadcn/ui installed and configured.
2. Set up a Supabase client wrapper (lib/supabase/client.ts for browser,
   lib/supabase/server.ts for server components/actions) using @supabase/ssr.
3. Write SQL migration files implementing this schema: profiles, categories,
   products, product_variants, product_images, inventory_logs, orders,
   order_items, addresses, carts, cart_items, ai_conversations, ai_messages.
   Include appropriate foreign keys, indexes on slug/sku/status columns, and
   Row Level Security policies: customers can only access their own rows
   (orders, cart, profile, addresses); admins/staff (role in profiles) have
   full read/write; anonymous/public users have read-only access to
   products, product_variants, product_images, categories where status =
   'active'.
4. Configure Supabase Auth: email/password sign-up/login, and a trigger that
   creates a profiles row on new auth.users insert, defaulting role to
   'customer'.
5. Scaffold a separate FastAPI service (Python 3.11) in a /ai-service
   directory with: a /health endpoint, environment-based config (Supabase
   URL/service key, OpenAI key), and a requirements.txt pinning fastapi,
   uvicorn, supabase-py, openai, pydantic.
6. Set up deployment: Next.js app deploys to Vercel from the repo root;
   ai-service deploys to Render as a separate web service from the
   /ai-service subdirectory. Document required environment variables for
   both in a README.
7. Add ESLint + TypeScript strict mode + a GitHub Actions workflow that runs
   lint and typecheck on every push.

Do not implement any UI beyond a placeholder homepage yet. Output the file
structure, migration SQL, and confirm both services deploy with a working
health check before proceeding.


Phase 1 — Storefront Core (Catalogue & Product Pages)
Goal: Public-facing browsing experience.
Deliverables: Homepage, product catalogue with category filters, individual product pages with variant selection, responsive design, brand theming applied (colors/fonts from Adire Teems brand assets), image handling via Supabase Storage, basic SEO metadata.
Master Prompt — Phase 1:
Building on the existing Adire Teems Next.js + Supabase foundation, implement
the public storefront browsing experience:

1. Homepage: hero/banner section (content-managed via a simple `site_content`
   table or hardcoded initially), featured products grid pulling from
   products where is_featured = true, category showcase section.
2. Category/catalogue page (/shop or /category/[slug]): paginated product
   grid, filter by category and price range, sort by price/newest, uses
   server components for initial data fetch from Supabase.
3. Product detail page (/product/[slug]): image gallery (from product_images,
   Supabase Storage URLs), variant selector (size/color from
   product_variants) with live stock display, price display, add-to-cart
   action, related products section.
4. Apply Adire Teems brand theme: [insert brand colors/fonts from the brand
   assets doc] via Tailwind config. Ensure fully responsive (mobile-first,
   since most customers will browse on mobile).
5. Add metadata (title, description, OG image) per product/category page for
   SEO using Next.js generateMetadata.
6. Handle empty/out-of-stock states gracefully (disable variant if stock_qty
   = 0, show "out of stock" badge).

Use server components for data fetching wherever possible; only use client
components for interactive elements (variant selector, filters). Do not
implement cart persistence or checkout yet — stub the add-to-cart action to
log to console.


Phase 2 — Cart, Checkout & Payments (Paystack + Flutterwave)
Goal: Full purchase flow with dual payment gateway support.
Deliverables: Persistent cart (guest + logged-in), checkout flow, Paystack integration (primary), Flutterwave fallback, webhook handling, order confirmation, order confirmation email, multi-currency display.
Master Prompt — Phase 2:
Implement cart and checkout for Adire Teems on top of the existing storefront:

1. Cart: client-side cart state (Zustand or React context) synced to the
   `carts`/`cart_items` tables when a user is authenticated; guest carts
   persist in localStorage and merge into the DB cart on login. Cart drawer/
   page shows line items, quantities (editable), subtotal.
2. Checkout page: shipping address form (save to `addresses`), delivery fee
   calculation (flat-rate config for now, structured so it can become
   zone-based later), order summary, currency selector (NGN default, USD/GBP
   optional display conversion — display only, settlement stays in NGN
   unless otherwise specified).
3. Payment integration:
   - Paystack as the primary payment method: initialize transaction via
     Paystack's API from a Next.js server action/route
     (/api/checkout/paystack), redirect to Paystack checkout, verify on
     return via /api/webhooks/paystack (verify signature using Paystack's
     webhook secret).
   - Flutterwave as fallback: if Paystack initialization fails or the
     customer selects it explicitly, use the same flow via
     /api/checkout/flutterwave and /api/webhooks/flutterwave.
   - On verified successful payment (webhook, not just client redirect),
     create the `orders` and `order_items` rows, decrement
     `product_variants.stock_qty`, write an `inventory_logs` entry with
     reason 'sale', and clear the cart.
4. Order confirmation page + email (using Resend or Supabase Edge Function)
   sent to the customer on successful order creation, including order
   number, items, total, and estimated delivery.
5. Handle failure/cancellation states clearly in the UI (retry payment,
   switch provider, contact support).

Payment provider API keys must be read from environment variables only.
Never trust client-side payment confirmation alone — order creation must be
gated on verified webhook events. Write basic tests for the webhook
signature verification logic.


Phase 3 — AI Shopping Assistant (Python/FastAPI + OpenAI)
Goal: The AI assistant described in the contract: product Q&A, recommendations, selection guidance, checkout assistance.
Deliverables: Chat widget in Next.js, FastAPI endpoint handling conversation + OpenAI calls, function calling grounded in real Supabase product data, conversation persistence, guardrails so it doesn't invent prices/stock.
Master Prompt — Phase 3:
Implement the AI Shopping Assistant for Adire Teems as a FastAPI service that
the Next.js storefront calls.

1. FastAPI endpoint POST /assistant/chat accepting {session_id, message,
   customer_id (optional)}. Loads/creates an ai_conversations row, stores the
   incoming message in ai_messages.
2. Use OpenAI's function-calling (GPT-4o-mini for cost efficiency, GPT-4o for
   complex queries) with these tool functions, each backed by real Supabase
   queries against products/product_variants/categories (read-only service
   key):
   - search_products(query, category, max_price) — returns matching products
     with live price and stock
   - get_product_details(product_id_or_slug) — full details incl. variants
     and stock
   - get_recommendations(product_id) — related/complementary products
   - check_stock(variant_id) — live stock count
3. System prompt must instruct the model to: only state prices/stock/product
   facts returned by tool calls (never invent them), keep a warm, culturally
   grounded tone appropriate to an Adire fabric brand, guide indecisive
   customers with clarifying questions (occasion, size, budget), and hand off
   to checkout guidance (link to cart/checkout) rather than trying to
   complete the purchase itself.
4. Store both the user message and assistant reply (plus any tool calls made)
   in ai_messages for the conversation, so admins can review chat quality
   later.
5. Rate-limit per session_id (e.g., 20 messages/hour) to control OpenAI
   costs; return a graceful message if the limit is hit.
6. On the Next.js side, build a chat widget (floating button + panel) that
   calls this endpoint, streams or shows typing indicator, and renders
   product cards inline when the assistant references specific products
   (parse structured product references from the tool call results, not by
   scraping the text reply).
7. Add basic logging/error handling so a failed OpenAI call degrades
   gracefully (fallback message + link to browse manually) rather than
   crashing the chat.

Keep the system prompt and tool definitions in clearly separated, editable
files so tone/behavior can be tuned without touching request-handling logic.


Phase 4 — Inventory Management System
Goal: Accurate, real-time stock tracking tied to sales and manual restocks.
Deliverables: Inventory logic already partly built in Phase 2 (auto-decrement on sale) extended with manual adjustment tooling, low-stock detection, inventory history view.
Master Prompt — Phase 4:
Extend the Adire Teems platform with full inventory management:

1. Ensure every stock change (sale, manual adjustment, restock) writes an
   inventory_logs row with variant_id, change_qty (positive or negative),
   reason, created_by (admin user id or null for system/sale), and a
   resulting_stock_qty snapshot for audit purposes.
2. Build an admin-only API (protected by role = 'admin'/'staff' RLS/route
   guard) to manually adjust stock: POST /api/admin/inventory/adjust
   {variant_id, change_qty, reason}, which updates product_variants.stock_qty
   transactionally and logs it.
3. Add a low-stock threshold field to product_variants (default configurable,
   e.g., 5 units); expose a query/view for "products below threshold" to
   power a dashboard alert.
4. Ensure Supabase Realtime is enabled on product_variants so both the
   storefront (live "X in stock" or "out of stock" badges) and the admin
   dashboard reflect changes without a page refresh.
5. Prevent overselling: when an order is created (Phase 2 webhook flow), use
   a Postgres transaction/row lock (or a stock check inside the same DB
   function) so two simultaneous purchases of the last unit can't both
   succeed.

Write this as reusable server-side functions (not duplicated logic between
the checkout webhook and the manual adjustment endpoint) — both should call
a shared adjustStock(variantId, changeQty, reason, actorId) function.


Phase 5 — Admin Dashboard
Goal: Full operational control for Adire Teems staff.
Deliverables: Auth-gated /admin area — product management (CRUD + image upload), order management (status updates), customer list, inventory view with low-stock alerts, basic sales reporting, AI conversation review.
Master Prompt — Phase 5:
Build the admin dashboard for Adire Teems at /admin (protected route — only
accessible to profiles.role in ('admin','staff'); redirect others).

1. Dashboard home: key metrics (today's orders, revenue this week/month,
   low-stock product count, pending orders count) pulled from Supabase.
2. Product management: list, create, edit, archive products; per-product
   variant management (add/edit size/color/price/stock); drag-and-drop or
   multi-file image upload to Supabase Storage with reordering.
3. Order management: list with status filter (pending, paid, shipped,
   delivered, cancelled), detail view per order (items, customer, address,
   payment reference/provider), ability to update status (triggers a
   customer notification email on status change).
4. Customer list: view registered customers, their order history, basic
   contact info (no payment credential data ever stored/displayed).
5. Inventory view: current stock per variant, low-stock flagged in red,
   manual adjustment form (calls the Phase 4 adjust endpoint), inventory
   history log per variant.
6. Sales reporting: simple charts (orders/revenue over time, top-selling
   products) using a lightweight charting library, date range filter.
7. AI conversation review (optional but valuable): list recent
   ai_conversations with message counts, allow admin to open and read a
   transcript, for quality monitoring.
8. Use shadcn/ui components (tables, dialogs, forms) for consistency with
   the storefront design system; keep the admin visually distinct (e.g.,
   sidebar nav) from the customer-facing storefront.

All admin routes/API calls must double-check role server-side, not just hide
UI elements client-side — RLS on the DB is the real gate, but route guards
should also fail closed.


Phase 6 — Testing, Hardening & Launch
Goal: Matches contract Phase 3 (Testing & Onboarding Week 5).
Deliverables: Cross-browser/device testing, payment sandbox-to-live cutover, security review, performance pass, admin training materials, handover documentation.
Master Prompt — Phase 6:
Prepare the Adire Teems platform for launch and handover:

1. Run through the full customer journey (browse → AI assistant → cart →
   checkout via both Paystack and Flutterwave in sandbox mode → order
   confirmation → email) and fix any breakages. Test on mobile viewport
   sizes primarily.
2. Security pass: confirm RLS policies deny cross-customer data access
   (test as two different authenticated users), confirm admin routes reject
   non-admin roles server-side, confirm no service-role keys are exposed to
   the client bundle, confirm payment webhook signature verification cannot
   be bypassed.
3. Performance pass: run Lighthouse on homepage/product/category pages,
   optimize images (Next.js Image component, correct sizing from Supabase
   Storage), check for N+1 queries in product listing pages.
4. Switch payment gateways from sandbox to live keys via environment
   variables (document the exact steps so Adire Teems' team can rotate keys
   later without developer help).
5. Generate a short admin user guide (or, since this is the "AI slides/docs"
   -adjacent output, a simple step-by-step doc) covering: adding a product,
   processing an order, checking low stock, reading the AI conversation log.
6. Final data check: confirm real product data (uploaded per the Client
   Requirements Checklist) is live, not placeholder/seed data, before
   go-live.

Produce a short handover checklist confirming: domain pointed correctly,
SSL active, live payment keys confirmed working with a real small
transaction, admin accounts created for the agreed team members, and
environment variable backups stored securely (e.g., in a password manager
shared with the client).


6. Environment Variables (reference)
Next.js (.env.local / Vercel): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only), PAYSTACK_SECRET_KEY, PAYSTACK_WEBHOOK_SECRET, FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_WEBHOOK_SECRET, AI_SERVICE_URL, RESEND_API_KEY
FastAPI (.env / Render): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read-only scoped policy recommended), OPENAI_API_KEY, ALLOWED_ORIGINS

7. Open Items to Confirm With Adire Teems
Final brand colors/fonts (blocks Phase 1 theming)
Whether USD/GBP are display-only or need real multi-currency settlement
Delivery fee structure (flat vs zone-based) before Phase 2
Who on their team gets admin vs staff-level dashboard access


