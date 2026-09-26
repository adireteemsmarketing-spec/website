-- Run once after 01_setup.sql in the hosted SQL Editor. Keeps existing data.
begin;
alter table public.products add column if not exists style_group text not null default '';
alter table public.products add column if not exists style text not null default '';
alter table public.products add column if not exists sku text unique;
alter table public.contact_messages add column if not exists notes text not null default '';
alter table public.contact_messages add column if not exists notification jsonb not null default '{"status":"pending","recipient":""}';
alter table public.contact_messages add column if not exists updated_at timestamptz not null default now();
grant update(notes,status) on public.contact_messages to authenticated;
create policy contact_manager_update on public.contact_messages for update to authenticated
 using(adire_private.is_manager()) with check(adire_private.is_manager());
create trigger adire_contact_touch before update on public.contact_messages for each row execute function adire_private.touch_updated();

-- A save is one transaction, including taxonomy, sizes and the primary image.
-- Invoker rights preserve the caller's RLS restrictions.
create function public.save_catalogue_product(payload jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare pid uuid := (payload->>'id')::uuid; category uuid; size_name text; variant uuid;
begin
 if not adire_private.is_manager() then raise exception 'Admin access required'; end if;
 if jsonb_array_length(payload->'sizes') < 1 then raise exception 'At least one size is required'; end if;
 select id into category from public.categories where slug=payload->>'category';
 if category is null then raise exception 'Choose an existing category slug'; end if;
 -- Serialize edits of this product without replacing unrelated records.
 perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
 insert into public.products(id,name,slug,description_short,description_long,category_id,department,fabric,base_price,currency,status,style_group,style,sku)
 values(pid,payload->>'name',payload->>'slug',payload->>'description',payload->>'description',category,payload->>'department',payload->>'fabric',(payload->>'price')::numeric,payload->>'currency',case when payload->>'status'='published' then 'active' else 'draft' end,coalesce(payload->>'styleGroup',''),coalesce(payload->>'style',''),payload->>'sku')
 on conflict(id) do update set name=excluded.name,slug=excluded.slug,description_short=excluded.description_short,description_long=excluded.description_long,category_id=excluded.category_id,department=excluded.department,fabric=excluded.fabric,base_price=excluded.base_price,currency=excluded.currency,status=excluded.status,style_group=excluded.style_group,style=excluded.style,sku=excluded.sku;
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

create function public.save_journal_post(payload jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare pid uuid := (payload->>'id')::uuid; category uuid;
begin
 if not adire_private.is_manager() then raise exception 'Admin access required'; end if;
 insert into public.blog_categories(name,slug) values(payload->>'category',payload->>'categorySlug') on conflict(slug) do update set name=excluded.name returning id into category;
 insert into public.blog_posts(id,slug,title,excerpt,content,content_format,category_id,author_id,author_name,featured_image,status,published_at)
 values(pid,payload->>'slug',payload->>'title',payload->>'excerpt',payload->>'content','plain',category,auth.uid(),payload->>'author',payload->>'image',payload->>'status',(payload->>'date')::timestamptz)
 on conflict(id) do update set slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,content=excluded.content,content_format=excluded.content_format,category_id=excluded.category_id,author_name=excluded.author_name,featured_image=excluded.featured_image,status=excluded.status,published_at=excluded.published_at;
 return pid;
end $$;

-- Trusted contact endpoint only. Serializing admission makes rate limits and
-- retry idempotency work across application instances.
create function public.submit_contact(payload jsonb) returns uuid
language plpgsql security invoker set search_path='' as $$
declare existing public.contact_messages; pid uuid := (payload->>'id')::uuid;
begin
 perform pg_advisory_xact_lock(22092601);
 select * into existing from public.contact_messages where id=pid;
 if found then
   if existing.name<>payload->>'name' or existing.email<>payload->>'email' or existing.subject<>payload->>'subject' or existing.message<>payload->>'message' then raise exception 'Submission reference already used'; end if;
   return pid;
 end if;
 if (select count(*) from public.contact_messages where created_at>now()-interval '1 hour')>=100 or
    (select count(*) from public.contact_messages where created_at>now()-interval '1 hour' and email=payload->>'email')>=5 then raise exception 'Too many messages'; end if;
 insert into public.contact_messages(id,name,email,subject,message,notification)
 values(pid,payload->>'name',payload->>'email',payload->>'subject',payload->>'message',jsonb_build_object('status','pending','recipient',payload->>'recipient'));
 return pid;
end $$;
revoke all on function public.save_catalogue_product(jsonb),public.save_journal_post(jsonb),public.submit_contact(jsonb) from public,anon,authenticated;
grant execute on function public.save_catalogue_product(jsonb),public.save_journal_post(jsonb) to authenticated;
grant execute on function public.submit_contact(jsonb) to service_role;
insert into adire_private.schema_version(version) values('20260922_01');
notify pgrst, 'reload schema';
commit;
