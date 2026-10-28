# Multiple product photos

In **Admin → Products → Add Product / Edit**, use **Product photos → Upload photos** to select several files at once. Each file can be PNG, JPEG or WebP up to 5 MB. A product can have up to 20 photos.

The first photo is the cover used in the shop and product cards. Choose **Make cover**, **Move earlier**, or **Move later** to arrange the gallery. Edit each photo's image description for accessibility. Use **Remove** to remove a photo from this product. You can also add an existing HTTPS image URL or local image path. Finally, save/publish the product. Closing or cancelling the editor does not save the gallery changes.

Existing photos are loaded when editing. Uploaded photos append to the gallery, and successful uploads are retained in the editor if another upload fails. Saving and navigation controls are locked during upload. The existing single-photo article and promotion uploaders continue to work.

## Release

Review and apply `supabase/08_product_image_galleries.sql` after `07_product_meta_descriptions.sql` before deploying the updated admin editor. The migration replaces the atomic catalogue-save function without changing existing gallery records. Explicit galleries save cover, order, alternate photos and alt text in the same transaction as the product. Older single-photo clients continue to replace only the cover while preserving alternate photos. Removing a photo from a gallery does not delete the underlying Storage file, which may be referenced elsewhere.

No live migration or deployment is performed as part of preparing these changes.

## Validation

Run `node --test frontend/tests/product-images.test.cjs`, `node supabase/tests/verify.mjs`, targeted ESLint, and `npm run build` from `frontend`. PostgreSQL checks cover repeatable migration application, reordering/removal, older clients, SEO preservation and rollback after invalid submissions. Frontend tests cover gallery validation, unsafe/duplicate URLs and single-/multiple-image rendering.
