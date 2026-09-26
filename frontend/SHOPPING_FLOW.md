# Shopping flow

The shared sample catalogue lives in `lib/catalog.ts`. Home collection links and shop product cards lead to product-specific URLs. Shop bag buttons open a native size-selection dialog. Add to Cart goes to the bag; Buy Now adds the selected variant and goes to checkout.

The cart saves product IDs, sizes and quantities in browser local storage. It merges matching variants, separates different sizes, caps quantities at 10 per variant, and drops invalid saved entries. Prices are resolved from the catalogue rather than saved cart data. This is a guest cart on the current device, not a server inventory or order system.

The original hosted photographs from the supplied design exports are used throughout the shopping flow. USD sample prices are retained pending business confirmation; these are not approved production prices. Sizes are sample options and require inventory confirmation.

Checkout validates contact and address inputs and displays the cart summary. Payments and delivery pricing are not configured. It does not submit an order, store an address, or charge a customer, and explicitly tells the customer this.

Before launch:

- Confirm currency, product prices, size availability and delivery regions/rates.
- Connect the catalogue to authoritative product and variant records.
- Create orders server-side with validated inventory and server-calculated totals.
- Integrate the chosen payment provider, verify webhooks and make fulfillment idempotent.
- Complete desktop/mobile browser verification against the supplied visual references. The in-app browser was unavailable during this implementation.

Validation: `npm run build`, focused ESLint checks, and `node --test scripts/cart.test.cjs`. The latter covers merging, separate sizes, quantity changes, removal, persistence roundtrips and invalid saved data.
