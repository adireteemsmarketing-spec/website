-- Conditional rollback; preserve any later manual edits.
begin;
update public.products set meta_description=null where id='1b399468-f2d2-4cc4-831f-dbe960206c96'::uuid and meta_description='Shop Indigo Cotton Adire Fabric with White Line Patterns from Adire Teems. Explore the product details and find your next wardrobe addition.';
commit;
