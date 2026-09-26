# Kaldoni product import

Published 101 products from `frontend/public/images/Edited picture for kaldoni` using the existing Supabase catalogue schema and storefront product template.

| Department | Products |
| --- | ---: |
| Women | 40 |
| Men | 15 |
| Kids | 5 |
| Fabrics | 41 |
| Total | 101 |

The 111 product images include alternate views. Ten copies in `Home_slideshow` were excluded from duplicate product creation. The 21 HEIC fabric photographs were converted to WebP; all original source files remain unchanged. Source filenames with numeric fabric references retain those references in their product names.

Prices are placeholders in NGN, ranging from ₦10,000 to ₦65,000. Sizes and five units per size are sample data for testing, not verified stock or sizing. There are 281 variants. Fabric variants use a sample one-yard unit. Review prices, available lengths, sizes and physical quantities before accepting real orders.

- `products.csv`: editable review list of names, descriptions, categories, prices, sample sizes and source images.
- `products.json`: complete prepared catalogue and stable import identifiers.
- `import-result.json`: publication results and product-page links.
- `verification.json`: live storefront verification results.
- `sheet-*.png` and `ankara-*.png`: source-image contact sheets used for visual review.

Products are visible at http://localhost:3000/shop and editable at http://localhost:3000/admin under Products and Inventory.

The import script only creates or resumes records belonging to this import. It does not overwrite unrelated products or replenish inventory on subsequent runs. Never include environment files or service credentials when sharing this report.
