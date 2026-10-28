-- Review and apply after 07_product_meta_descriptions.sql before deploying multi-photo editing.
-- No existing product or gallery rows are changed by this migration.
begin;
alter table public.products add column if not exists meta_description text;
create or replace function public.save_catalogue_product(payload jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare pid uuid := (payload->>'id')::uuid; category uuid; size_name text; variant uuid;
begin
 if not adire_private.is_manager() then raise exception 'Admin access required'; end if;
 if jsonb_array_length(payload->'sizes') < 1 then raise exception 'At least one size is required'; end if;
 select id into category from public.categories where slug=payload->>'category';
 if category is null then raise exception 'Choose an existing category slug'; end if;
 -- Serialize edits of this product without replacing unrelated records.
 perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
 insert into public.products(id,name,slug,description_short,description_long,category_id,department,fabric,base_price,currency,status,style_group,style,sku,meta_description)
 values(pid,payload->>'name',payload->>'slug',payload->>'description',payload->>'description',category,payload->>'department',payload->>'fabric',(payload->>'price')::numeric,payload->>'currency',case when payload->>'status'='published' then 'active' else 'draft' end,coalesce(payload->>'styleGroup',''),coalesce(payload->>'style',''),payload->>'sku',nullif(btrim(payload->>'metaDescription'),''))
 on conflict(id) do update set name=excluded.name,slug=excluded.slug,description_short=excluded.description_short,description_long=excluded.description_long,category_id=excluded.category_id,department=excluded.department,fabric=excluded.fabric,base_price=excluded.base_price,currency=excluded.currency,status=excluded.status,style_group=excluded.style_group,style=excluded.style,sku=excluded.sku,meta_description=case when payload ? 'metaDescription' then excluded.meta_description else public.products.meta_description end;
 if exists(select 1 from public.product_variants v join public.inventory i on i.variant_id=v.id where v.product_id=pid and not (payload->'sizes' ? v.size) and i.quantity>0) then raise exception 'Remove stock before removing a size'; end if;
 update public.product_variants set active=(payload->'sizes' ? size) where product_id=pid;
 for size_name in select distinct jsonb_array_elements_text(payload->'sizes') loop
   if not exists(select 1 from public.product_variants where product_id=pid and size=size_name) then
     variant := gen_random_uuid();
     insert into public.product_variants(id,product_id,size,sku) values(variant,pid,size_name,(payload->>'sku')||'-'||variant::text);
   end if;
 end loop;
 if payload ? 'images' then
   if jsonb_typeof(payload->'images') <> 'array' or jsonb_array_length(payload->'images') not between 1 and 20 then
     raise exception 'Add between 1 and 20 product photos';
   end if;
   if exists(select 1 from jsonb_array_elements(payload->'images') img where nullif(btrim(img->>'path'),'') is null or length(img->>'path')>2000 or length(img->>'alt')>300) then
     raise exception 'Invalid product photo';
   end if;
   if (select count(distinct img->>'path') from jsonb_array_elements(payload->'images') img) <> jsonb_array_length(payload->'images') then
     raise exception 'Duplicate product photos';
   end if;
   -- The explicitly submitted ordered gallery is saved with the product in one transaction.
   delete from public.product_images where product_id=pid;
   insert into public.product_images(product_id,storage_path,alt_text,sort_order)
   select pid,img->>'path',coalesce(nullif(btrim(img->>'alt'),''),payload->>'name'),(position-1)::integer
   from jsonb_array_elements(payload->'images') with ordinality as entries(img,position);
 else
   -- Legacy single-image clients only replace the cover; preserve their existing gallery.
   delete from public.product_images where product_id=pid and sort_order=0;
   insert into public.product_images(product_id,storage_path,alt_text,sort_order) values(pid,payload->>'image',payload->>'name',0);
 end if;
 return pid;
end $$;


commit;
