# Adire Teems admin

Open `/admin` and sign in with your Supabase Auth email and password. Your profile
must have role `admin` or `super_admin`. The previous shared password is unused.

Run `supabase/04_application_integration.sql` once before saving data. See
[the connection guide](../supabase/CONNECT_APPLICATION.md) for setup and verification.

- Products: choose an existing category, currency and sizes. Upload an image,
  then save as a draft or publish. Each size starts with zero stock.
- Inventory: choose a variant and location, enter a signed adjustment and reason.
  Adjustments are logged; reserved quantities cannot be removed.
- Blog: write plain-text articles, upload images, and publish. Future-dated posts
  are hidden until their publication date.
- Messages: review contacts, update notes/status and retry configured email delivery.
- Settings: Super Admin only. Save store name, contact email and low-stock threshold.
- Delete archives a product or post while preserving historical references.

Products, posts, contacts and settings persist in Supabase. New uploads use private
Storage; the application serves published images and authenticated draft previews.
Existing local content has not been imported or deleted. The storefront refreshes
catalogue data every 15 seconds and when the window regains focus.

Checkout and payments remain unimplemented; carts do not reserve stock.
