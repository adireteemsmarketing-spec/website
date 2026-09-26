-- Read-only installation checks for SQL Editor. Run after 01_setup.sql.
-- These check installed objects; tests/verify.mjs separately exercises allow/deny rules.
do $$
declare n integer;
begin
 if not exists(select 1 from adire_private.schema_version where version='20260914_01') then raise exception 'Expected schema version is missing'; end if;
 select count(*) into n from pg_tables where schemaname='public' and tablename in (
 'locations','profiles','addresses','categories','collections','tags','products','product_variants','product_images','product_tags','product_collections','related_products',
 'inventory','inventory_logs','carts','cart_items','wishlist_items','shipping_zones','shipping_rates','orders','order_items','stock_reservations','payments','payment_events','shipments','order_events','return_requests','refunds',
 'custom_orders','custom_order_files','measurements','consultations','quotations','blog_categories','blog_posts','blog_tags','blog_post_tags','site_pages','site_content','store_settings','newsletter_subscribers','contact_messages','reviews','notifications','ai_conversations','ai_messages','audit_logs') and rowsecurity;
 if n<>47 then raise exception 'Expected 47 RLS-protected tables; found %',n; end if;
 if has_column_privilege('authenticated','public.profiles','role','UPDATE') then raise exception 'Unsafe profile role update grant'; end if;
 if has_table_privilege('authenticated','public.orders','UPDATE') then raise exception 'Unsafe client order update grant'; end if;
 if has_table_privilege('anon','public.inventory','SELECT') then raise exception 'Exact inventory is exposed to anonymous clients'; end if;
 if has_table_privilege('authenticated','public.inventory','UPDATE') then raise exception 'Client can bypass stock adjustment logs'; end if;
 select count(*) into n from storage.buckets where id in ('product-images','journal-images','site-assets','draft-media','custom-inspiration','avatars');
 if n<>6 then raise exception 'Expected 6 media buckets'; end if;
 if exists(select 1 from storage.buckets where id in ('draft-media','custom-inspiration','avatars') and public) then raise exception 'Private bucket is public'; end if;
 raise notice 'PASS: database objects, RLS, critical grants and buckets';
end $$;
select 'Super admin accounts' as check_name,count(*) as result from public.profiles where role='super_admin';
select 'Categories' as check_name,count(*) as result from public.categories;
select 'Collections' as check_name,count(*) as result from public.collections;
