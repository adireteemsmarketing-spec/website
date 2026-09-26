# Adire Teems — Roles, Permissions & Access Hierarchy

This document defines who can do what on the Adire Teems platform: the permission tiers, how they relate to each other, and how access is scoped by location for sales representatives. It's meant to guide both the database access rules (Supabase RLS) and the platform UI (what each role sees/can click).

There are two separate tracks of roles:

- **Staff hierarchy** — Super Admin → Admin → Sales Representative — runs the business
- **User** — the customer/buyer role — everyone who signs up to shop on the platform

A User is never part of the staff hierarchy and never gains admin capabilities, regardless of how much they purchase.

---

## 1. Role Hierarchy Overview

```
   STAFF HIERARCHY (internal)              CUSTOMER-FACING ROLE
   ┌─────────────────┐
   │   SUPER ADMIN     │  Full system control
   └────────┬─────────┘
            │
   ┌────────▼─────────┐
   │      ADMIN        │  Full operational control,
   │                    │  no system/account-level control
   └────────┬─────────┘
            │
  ┌─────────┼─────────┐
  ▼         ▼         ▼
┌───────┐┌───────┐┌───────┐              ┌─────────────────┐
│ Sales  ││ Sales  ││ Sales  │              │      USER         │
│ Rep A  ││ Rep B  ││ Rep C  │              │  (Buyer/Customer)  │
└───────┘└───────┘└───────┘              └─────────────────┘
  Scoped strictly to their                  Scoped strictly to
  own location's data                       their own account/
                                             orders — no visibility
                                             into any other user's
                                             data, ever
```

**Principle:** within the staff hierarchy, authority increases going up and visibility narrows going down. The User role sits entirely outside that hierarchy — it has no administrative authority at any level; it exists purely to browse and buy.

---

## 2. Role Definitions

### 2.1 Super Admin
The owner-level role. Typically 1–2 people (e.g. Adire Teems founder/ops lead).

- Full access to every module, every location, no restrictions
- Only role that can create/remove Admin accounts
- Only role that can access payment gateway configuration, API keys, and system settings
- Only role that can view platform-wide financial reporting across all locations
- Can override/reassign any order or inventory record regardless of location

### 2.2 Admin
Day-to-day operational managers. Can run the business but can't touch system-level configuration or account security settings.

- Full access to products, orders, inventory, customers, and reporting **across all locations**
- Can create and manage Sales Representative accounts (but not other Admins or Super Admins)
- Can view the AI conversation log for quality monitoring
- **Cannot** access payment gateway credentials/API keys
- **Cannot** change platform-wide settings (branding, domains, integrations)
- **Cannot** promote anyone to Admin or Super Admin

### 2.3 Sales Representative (Location-Scoped)
Front-line staff assigned to a specific physical location or sales channel. Their access is deliberately narrow.

- Can view and manage **orders belonging to their assigned location only**
- Can view **inventory/stock levels for their assigned location only**
- Can record a sale / adjust stock for their location (with all changes logged, not silently editable)
- Can view **customer records tied to orders at their location**
- **Cannot** see other locations' orders, inventory, or customers
- **Cannot** access reporting beyond their own location's basic sales summary
- **Cannot** edit product catalogue (name, price, description, images) — catalogue is centrally managed by Admin/Super Admin
- **Cannot** access the AI conversation log or platform settings

### 2.4 User (Buyer)
Anyone who creates a customer account to shop on the platform. This is a **non-staff role** — it has no dashboard access, no visibility into other customers, and no operational permissions of any kind.

- Can browse the product catalogue and use the AI shopping assistant
- Can add items to cart and complete purchases
- Can view and manage **their own** profile, saved addresses, and payment methods
- Can view **their own** order history and order status
- Can initiate a return/refund **request** (routed to Admin for approval — see Escalation Rules)
- Can message/interact with the AI assistant; conversation history is tied only to their own account
- **Cannot** view any other user's orders, profile, or activity
- **Cannot** access `/admin` under any circumstance
- **Cannot** see inventory counts beyond a basic "in stock / out of stock" indicator
- **Cannot** see internal pricing history, cost data, or reporting

---

## 3. Permission Matrix

| Capability | Super Admin | Admin | Sales Rep (own location) | User (Buyer) |
|---|:---:|:---:|:---:|:---:|
| **Products** |
| View product catalogue | ✅ | ✅ | ✅ (view only) | ✅ (public view only) |
| Create/edit/archive products | ✅ | ✅ | ❌ | ❌ |
| Upload product images | ✅ | ✅ | ❌ | ❌ |
| **Inventory** |
| View stock — all locations | ✅ | ✅ | ❌ | ❌ |
| View stock — own location | ✅ | ✅ | ✅ | — |
| View basic stock status (in/out) | ✅ | ✅ | ✅ | ✅ |
| Manually adjust stock | ✅ | ✅ (all) | ✅ (own location, logged) | ❌ |
| **Orders** |
| View orders — all locations | ✅ | ✅ | ❌ | ❌ |
| View orders — own location | ✅ | ✅ | ✅ | — |
| View own order history | ✅ | ✅ | ✅ | ✅ (own orders only) |
| Place an order | — | — | — | ✅ |
| Update order status | ✅ | ✅ | ✅ (own location) | ❌ |
| Cancel/refund an order | ✅ | ✅ | ❌ (escalate) | ❌ (can request only) |
| **Customers** |
| View all customer records | ✅ | ✅ | ❌ | ❌ |
| View customers linked to own location | ✅ | ✅ | ✅ | ❌ |
| View/edit own profile & addresses | ✅ | ✅ | ✅ | ✅ (own only) |
| Export customer data | ✅ | ❌ | ❌ | ❌ |
| **Reporting** |
| Platform-wide sales/revenue reporting | ✅ | ✅ | ❌ | ❌ |
| Own-location sales summary | ✅ | ✅ | ✅ | ❌ |
| Financial/payout reporting | ✅ | ❌ | ❌ | ❌ |
| **AI Assistant** |
| Use the AI shopping assistant | ✅ | ✅ | ✅ | ✅ |
| View AI conversation logs (all users) | ✅ | ✅ | ❌ | ❌ |
| View own AI conversation history | — | — | — | ✅ (own only) |
| Edit AI assistant tone/behavior config | ✅ | ❌ | ❌ | ❌ |
| **User & Access Management** |
| Create/edit Super Admin accounts | ✅ | ❌ | ❌ | ❌ |
| Create/edit Admin accounts | ✅ | ❌ | ❌ | ❌ |
| Create/edit Sales Rep accounts | ✅ | ✅ | ❌ | ❌ |
| Deactivate staff accounts | ✅ | ✅ (Sales Reps only) | ❌ | ❌ |
| Deactivate own account | ✅ | ✅ | ✅ | ✅ |
| **System & Settings** |
| Payment gateway configuration/API keys | ✅ | ❌ | ❌ | ❌ |
| Domain, branding, integrations | ✅ | ❌ | ❌ | ❌ |
| Database/backup access | ✅ | ❌ | ❌ | ❌ |

---

## 4. Location Scoping — How It Works

Location scoping applies only within the staff hierarchy (Sales Reps). Users (buyers) are not assigned to a location — they simply shop the platform and their orders carry a `location_id` based on fulfillment routing, not account restriction.

**Data model implication (Supabase):**
- A `locations` table holds each physical/sales location (name, address, etc.)
- The `profiles` table gets a `location_id` column, set only for Sales Rep accounts (null for Admin, Super Admin, and User accounts)
- `orders` carry a `location_id` (which fulfillment/sales location handled it) regardless of role
- Row Level Security policies:
  - If `role = 'sales_rep'` → only return rows where `location_id` matches the rep's own `profiles.location_id`
  - If `role = 'user'` → only return rows where the row's `customer_id` matches their own `auth.uid()`, with no location filter at all
  - Admin and Super Admin skip the location filter entirely

**Reassigning a Sales Rep:** if someone moves locations, an Admin or Super Admin updates their `location_id` — access shifts immediately and automatically.

---

## 5. Escalation Rules

| Situation | Who Handles It |
|---|---|
| A **User** requests a refund/cancellation | User submits request → Sales Rep (if it's their location's order) or Admin reviews and processes |
| Stock discrepancy beyond normal adjustment | Sales Rep reports → Admin investigates and corrects |
| New product needs to be added to catalogue | Admin or Super Admin only |
| A Sales Rep needs access to another location temporarily | Admin reassigns `location_id` or creates a second scoped account — never a blanket permission override |
| Payment/payout issue | Escalates directly to Super Admin |
| A User account is suspected of fraud/abuse | Admin or Super Admin only can suspend a User account |

---

## 6. Account Lifecycle & Security Notes

- **Staff account creation:** Super Admin creates Admin accounts. Admin or Super Admin creates Sales Rep accounts (with mandatory location assignment at creation).
- **User account creation:** self-service — anyone can sign up as a User via the storefront; no staff approval required.
- **Deactivation over deletion:** Staff accounts should be deactivated (not deleted) when someone leaves, so historical order/inventory logs still show who did what. User accounts can be deactivated on request (data retention per privacy policy) but purchase history tied to orders should be retained for accounting/audit purposes.
- **Every privileged action is logged:** stock adjustments, order status changes, and staff account changes should always record `created_by` / `actor_id`.
- **Role changes require re-authentication:** if a staff member's role or location assignment is changed, their existing session should be invalidated so the new permission set takes effect immediately.
- **Principle of least privilege:** default every new staff account to the most restrictive role that lets them do their job (Sales Rep, location-scoped). Admin and Super Admin are granted deliberately, not by default. Users are, by design, always the most restricted role on the platform.

---

*Adire Teems — Roles, Permissions & Access Hierarchy · For internal reference during platform build*
