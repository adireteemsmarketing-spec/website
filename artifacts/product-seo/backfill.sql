-- REVIEW BEFORE APPLYING. Only blank descriptions at the audited revision are eligible.
begin;
update public.products set meta_description='Shop Indigo Cotton Adire Fabric with White Line Patterns from Adire Teems. Explore the product details and find your next wardrobe addition.' where id='1b399468-f2d2-4cc4-831f-dbe960206c96'::uuid and updated_at='2026-10-22T12:23:35.918583+00:00'::timestamptz and coalesce(btrim(meta_description),'')='';
commit;
