# Storefront content and order preparation

## Homepage promotion

Open **Admin → Homepage** to edit the heading, message, optional image, and optional button. Both Admin and Super Admin accounts can manage this section. Upload an image or use a local path or HTTPS URL. Supply both button text and its link, or leave both blank for an announcement.

Select **Show on homepage** and save to publish. Clear that option and save to hide the section while preserving the draft. Until the first promotion is published, the old fixed autumn discount is not displayed. Storefront tabs refresh content within 15 seconds or when refocused.

This uses the existing `site_content` table, with the single key `homepage_promotion`; no database migration is required for an installation using `supabase/01_setup.sql`. Public reads are restricted to published content. Admin writes authenticate the manager and can change only this content key. Uploaded images use the existing media endpoint and become publicly accessible only while referenced by published content.

## Packing orders

Open **Admin → Orders → View purchased products**. Each order line shows its name, SKU, size, colour, quantity, and available product images. Click a thumbnail to open the full image. Images come from the current catalogue; these are not immutable purchase-time image snapshots. Missing images leave the order details available for packing.

## Purchase confirmation

Successful Paystack callbacks lead to `/thank-you/[order-id]`. The page requires the customer account and reads its verified payment record. Pending or failed payments continue to the order/payment flow. The page provides order tracking and continued shopping links; test payments remain clearly identified.

## Checks

From `frontend`, run `node --test scripts/storefront-updates.test.cjs scripts/cart.test.cjs scripts/styles.test.cjs` for promotion validation/access, product image mapping, payment redirects, confirmation visibility, cart behavior, and filter matching.
