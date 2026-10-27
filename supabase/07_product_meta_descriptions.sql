-- Review and apply before deploying the SEO admin editor. No existing product copy is changed.
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
 -- Preserve gallery images beyond the primary slot.
 delete from public.product_images where product_id=pid and sort_order=0;
 insert into public.product_images(product_id,storage_path,alt_text,sort_order) values(pid,payload->>'image',payload->>'name',0);
 return pid;
end $$;


commit;
