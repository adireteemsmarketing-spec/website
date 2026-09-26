-- ADIRE TEEMS: fresh Supabase project bootstrap (Postgres 15+).
-- Run this whole file once in SQL Editor as postgres. Transactional; no DROP TABLE.
-- If a project already has these tables, STOP and write a migration instead.
-- Do not also run backend/db/rls_policies.sql: this replaces that older draft.
begin;
create schema adire_private;
revoke all on schema adire_private from public;
grant usage on schema adire_private to authenticated, anon, service_role;

-- 1. People, locations and roles. Amounts are numeric major currency units.
create table public.locations (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 address jsonb not null default '{}', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 id uuid generated always as (user_id) stored unique,
 role text not null default 'user' check (role in ('user','sales_rep','admin','super_admin')),
 location_id uuid references public.locations(id), full_name text not null default '',
 email text, phone text, avatar_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check (role <> 'sales_rep' or location_id is not null)
);
create table public.addresses (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(user_id) on delete cascade,
 label text, full_name text not null, phone text, line1 text not null, line2 text,
 city text not null, state text, postal_code text, country_code text not null check(country_code ~ '^[A-Z]{2}$'),
 is_default boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_default_address on public.addresses(customer_id) where is_default;

-- 2. Catalogue, collections, facets and SEO. A product is never duplicated for an occasion.
create table public.categories (
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.categories(id),
 name text not null, slug text not null unique, description text not null default '',
 department text check(department in ('women','men','kids','accessories','fabrics')),
 sort_order integer not null default 0, active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(id <> parent_id)
);
create table public.collections (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 kind text not null check(kind in ('fabric','occasion','season','editorial','promotion')),
 description text not null default '', history text not null default '', image_path text,
 seo_title text, meta_description text, canonical_url text, noindex boolean not null default false,
 published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tags (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null,
 kind text not null check(kind in ('department','product_type','fabric','occasion','style','colour','fit','length','sleeve','season','attribute')),
 unique(kind,slug)
);
create table public.products (
 id uuid primary key default gen_random_uuid(), legacy_id text unique,
 name text not null, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description_short text not null default '', description_long text not null default '',
 category_id uuid references public.categories(id), department text not null check(department in ('women','men','kids','accessories','fabrics')),
 fabric text, base_price numeric(14,2) not null check(base_price >= 0),
 currency text not null default 'NGN' check(currency ~ '^[A-Z]{3}$'),
 unit text not null default 'piece' check(unit in ('piece','yard','metre','set')),
 availability text not null default 'in_stock' check(availability in ('in_stock','pre_order','made_to_order')),
 status text not null default 'draft' check(status in ('active','draft','archived')),
 is_featured boolean not null default false, care_guide text, size_guide text,
 seo_title text, meta_description text, canonical_url text, noindex boolean not null default false,
 search_document tsvector generated always as (to_tsvector('english',coalesce(name,'')||' '||coalesce(description_short,'')||' '||coalesce(fabric,''))) stored,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index products_search on public.products using gin(search_document);
create index products_status_category on public.products(status,category_id);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 size text not null default 'One size', color text not null default 'Original', sku text not null unique,
 price_override numeric(14,2) check(price_override >= 0), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(product_id,size,color)
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 storage_path text not null, alt_text text not null default '', sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table public.product_tags (
 product_id uuid not null references public.products(id) on delete cascade,
 tag_id uuid not null references public.tags(id) on delete cascade, primary key(product_id,tag_id)
);
create table public.product_collections (
 product_id uuid not null references public.products(id) on delete cascade,
 collection_id uuid not null references public.collections(id) on delete cascade, primary key(product_id,collection_id)
);
create table public.related_products (
 product_id uuid not null references public.products(id) on delete cascade,
 related_id uuid not null references public.products(id) on delete cascade,
 kind text not null default 'related' check(kind in ('related','complete_the_look')),
 primary key(product_id,related_id,kind), check(product_id <> related_id)
);

-- 3. Variant stock per location. Exact quantities are NOT public.
create table public.inventory (
 id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id),
 location_id uuid not null references public.locations(id), quantity integer not null default 0 check(quantity>=0),
 reserved integer not null default 0 check(reserved>=0 and reserved<=quantity), low_stock_threshold integer not null default 5 check(low_stock_threshold>=0),
 updated_at timestamptz not null default now(), unique(variant_id,location_id)
);
create table public.inventory_logs (
 id uuid primary key default gen_random_uuid(), inventory_id uuid not null references public.inventory(id),
 variant_id uuid not null references public.product_variants(id), location_id uuid not null references public.locations(id),
 change_qty integer not null, previous_qty integer not null, resulting_qty integer not null,
 reason text not null, created_by uuid references public.profiles(user_id) on delete set null,
 created_at timestamptz not null default now()
);

-- 4. Carts and wish lists. Guests use local carts or a protected server session.
create table public.carts (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null unique references public.profiles(user_id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.cart_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade,
 variant_id uuid not null references public.product_variants(id) on delete cascade,
 quantity integer not null check(quantity between 1 and 999), created_at timestamptz not null default now(), unique(cart_id,variant_id)
);
create table public.wishlist_items (
 customer_id uuid not null references public.profiles(user_id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(customer_id,product_id)
);

-- 5. Orders, payments, delivery and returns. Trusted server writes only for financial records.
create table public.shipping_zones (
 id uuid primary key default gen_random_uuid(), name text not null, country_codes text[] not null default '{}',
 active boolean not null default false
);
create table public.shipping_rates (
 id uuid primary key default gen_random_uuid(), zone_id uuid not null references public.shipping_zones(id) on delete cascade,
 name text not null, currency text not null check(currency ~ '^[A-Z]{3}$'), amount numeric(14,2) not null check(amount>=0),
 min_days integer check(min_days>=0), max_days integer check(max_days>=min_days), active boolean not null default false
);
create table public.orders (
 id uuid primary key default gen_random_uuid(), order_number text not null unique,
 customer_id uuid references public.profiles(user_id) on delete set null,
 location_id uuid not null references public.locations(id), guest_email text,
 status text not null default 'pending' check(status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
 subtotal numeric(14,2) not null check(subtotal>=0), delivery_fee numeric(14,2) not null default 0 check(delivery_fee>=0),
 tax numeric(14,2) not null default 0 check(tax>=0), discount numeric(14,2) not null default 0 check(discount>=0),
 total numeric(14,2) not null check(total>=0), currency text not null check(currency ~ '^[A-Z]{3}$'),
 shipping_address jsonb not null, payment_provider text check(payment_provider in ('paystack','flutterwave','paypal','manual')),
 payment_reference text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(total=subtotal+delivery_fee+tax-discount), check(customer_id is not null or guest_email is not null)
);
create index orders_customer on public.orders(customer_id,created_at desc);
create index orders_location on public.orders(location_id,status);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 variant_id uuid references public.product_variants(id), product_name text not null, sku text not null, size text, color text,
 quantity integer not null check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0)
);
create table public.stock_reservations (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 inventory_id uuid not null references public.inventory(id), quantity integer not null check(quantity>0),
 status text not null default 'held' check(status in ('held','consumed','released')),
 expires_at timestamptz not null, created_at timestamptz not null default now(), unique(order_id,inventory_id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 provider text not null check(provider in ('paystack','flutterwave','paypal','manual')), reference text not null,
 amount numeric(14,2) not null check(amount>=0), currency text not null check(currency ~ '^[A-Z]{3}$'),
 status text not null default 'pending' check(status in ('pending','successful','failed','refunded')),
 verified_at timestamptz, created_at timestamptz not null default now(), unique(provider,reference)
);
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
 payment_id uuid references public.payments(id), processed_at timestamptz, created_at timestamptz not null default now(),
 unique(provider,provider_event_id)
);
create table public.shipments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 carrier text, tracking_number text, tracking_url text, status text not null default 'pending' check(status in ('pending','shipped','delivered','failed','returned')),
 shipped_at timestamptz, delivered_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.order_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 status text not null, customer_note text, created_at timestamptz not null default now()
);
create table public.return_requests (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
 customer_id uuid not null references public.profiles(user_id), reason text not null,
 status text not null default 'requested' check(status in ('requested','approved','rejected','received','refunded')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.refunds (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id),
 return_id uuid references public.return_requests(id), provider_reference text unique,
 amount numeric(14,2) not null check(amount>0), status text not null default 'pending' check(status in ('pending','successful','failed')),
 created_at timestamptz not null default now()
);

-- 6. Custom-made service: inspiration, measurements, consultations and quotations.
create table public.custom_orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid references public.profiles(user_id) on delete set null,
 location_id uuid references public.locations(id), guest_email text,
 description text not null, category text, occasion text, fabric text,
 measurement_snapshot jsonb not null default '{}' check(jsonb_typeof(measurement_snapshot)='object'),
 status text not null default 'submitted' check(status in ('submitted','consultation','quoted','accepted','production','ready','delivered','cancelled')),
 needed_by date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(customer_id is not null or guest_email is not null)
);
create table public.custom_order_files (
 id uuid primary key default gen_random_uuid(), custom_order_id uuid not null references public.custom_orders(id) on delete cascade,
 owner_id uuid not null references public.profiles(user_id), storage_path text not null,
 description text, created_at timestamptz not null default now()
);
create table public.measurements (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(user_id) on delete cascade,
 label text not null, unit text not null default 'cm' check(unit in ('cm','in')),
 values jsonb not null check(jsonb_typeof(values)='object'), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.consultations (
 id uuid primary key default gen_random_uuid(), custom_order_id uuid not null references public.custom_orders(id),
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at),
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
 meeting_details text, created_at timestamptz not null default now()
);
create table public.quotations (
 id uuid primary key default gen_random_uuid(), custom_order_id uuid not null references public.custom_orders(id),
 version integer not null default 1 check(version>0), amount numeric(14,2) not null check(amount>=0),
 currency text not null check(currency ~ '^[A-Z]{3}$'), details jsonb not null default '{}',
 status text not null default 'draft' check(status in ('draft','sent','accepted','declined','expired')),
 expires_at timestamptz, created_at timestamptz not null default now(), unique(custom_order_id,version)
);

-- 7. Journal CMS, SEO, site pages and marketing.
create table public.blog_categories (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique
);
create table public.blog_posts (
 id uuid primary key default gen_random_uuid(), legacy_id text unique, slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null, excerpt text not null default '', content text not null default '',
 content_format text not null default 'markdown' check(content_format in ('plain','markdown')),
 category_id uuid references public.blog_categories(id), author_id uuid references public.profiles(user_id) on delete set null,
 author_name text not null, featured_image text, image_alt text not null default '',
 status text not null default 'draft' check(status in ('draft','published','archived')),
 published_at timestamptz, seo_title text, meta_description text, canonical_url text,
 noindex boolean not null default false, is_featured boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status<>'published' or published_at is not null)
);
create index blog_publication on public.blog_posts(status,published_at desc);
create table public.blog_tags (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique
);
create table public.blog_post_tags (
 post_id uuid not null references public.blog_posts(id) on delete cascade,
 tag_id uuid not null references public.blog_tags(id) on delete cascade, primary key(post_id,tag_id)
);
create table public.site_pages (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, content text not null default '',
 published boolean not null default false, seo_title text, meta_description text, noindex boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.site_content (
 key text primary key, value jsonb not null default '{}', published boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.store_settings (
 key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
comment on table public.store_settings is 'Non-secret settings only. Payment/API secrets belong in server environment or Vault, never in public catalogue settings.';
create table public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 status text not null default 'pending' check(status in ('pending','subscribed','unsubscribed')),
 consent_at timestamptz, confirmed_at timestamptz, created_at timestamptz not null default now()
);
create table public.contact_messages (
 id uuid primary key default gen_random_uuid(), customer_id uuid references public.profiles(user_id) on delete set null,
 name text not null, email text not null, subject text not null, message text not null,
 status text not null default 'new' check(status in ('new','open','closed')), created_at timestamptz not null default now()
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 customer_id uuid not null references public.profiles(user_id), rating integer not null check(rating between 1 and 5),
 title text, body text not null, display_name text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), unique(product_id,customer_id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(user_id) on delete cascade,
 title text not null, body text not null, href text, read_at timestamptz, created_at timestamptz not null default now()
);

-- 8. AI, support and audit. Guests reach these only via rate-limited server routes.
create table public.ai_conversations (
 id uuid primary key default gen_random_uuid(), customer_id uuid references public.profiles(user_id) on delete set null,
 session_id uuid not null default gen_random_uuid(), created_at timestamptz not null default now()
);
create table public.ai_messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
 role text not null check(role in ('user','assistant','tool','system')), content text not null,
 created_at timestamptz not null default now()
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(user_id) on delete set null,
 action text not null, entity_type text not null, entity_id text, details jsonb not null default '{}',
 created_at timestamptz not null default now()
);

-- 9. Helpers: private schema, pinned search_path, explicit execute grants.
create function adire_private.role_name() returns text language sql stable security definer set search_path=''
as $$ select coalesce((select role from public.profiles where user_id=(select auth.uid())),'guest') $$;
create function adire_private.is_manager() returns boolean language sql stable security definer set search_path=''
as $$ select adire_private.role_name() in ('admin','super_admin') $$;
create function adire_private.can_location(target uuid) returns boolean language sql stable security definer set search_path=''
as $$ select adire_private.is_manager() or exists(select 1 from public.profiles where user_id=(select auth.uid()) and role='sales_rep' and location_id=target) $$;
create function adire_private.can_order(target uuid) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.orders o where o.id=target and (o.customer_id=(select auth.uid()) or adire_private.can_location(o.location_id))) $$;
create function adire_private.can_custom(target uuid) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.custom_orders o where o.id=target and (o.customer_id=(select auth.uid()) or adire_private.can_location(o.location_id))) $$;
create function adire_private.touch_updated() returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now(); return new; end $$;
create function adire_private.new_profile() returns trigger language plpgsql security definer set search_path=''
as $$ begin insert into public.profiles(user_id,email,full_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(user_id) do nothing; return new; end $$;
create trigger adire_auth_profile after insert on auth.users for each row execute function adire_private.new_profile();
insert into public.profiles(user_id,email,full_name) select id,email,coalesce(raw_user_meta_data->>'full_name','') from auth.users on conflict(user_id) do nothing;

-- Minimal audit metadata, not copies of private customer details or payment payloads.
create function adire_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare record_data jsonb;
begin
 record_data=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id)
 values(auth.uid(),lower(tg_op),tg_table_name,coalesce(record_data->>'id',record_data->>'key'));
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['products','blog_posts','orders','shipments','return_requests','custom_orders','quotations','store_settings'] loop
 execute format('create trigger adire_audit after insert or update or delete on public.%I for each row execute function adire_private.audit_change()',t);
 end loop;
end $$;

-- Only trusted RPCs can change roles: users cannot promote themselves through profile updates.
create function public.assign_staff_role(target_user uuid, new_role text, new_location uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text; target_role text;
begin
 actor_role=adire_private.role_name();
 if new_role not in ('user','sales_rep','admin','super_admin') then raise exception 'Invalid role'; end if;
 select role into target_role from public.profiles where user_id=target_user for update;
 if not found then raise exception 'Profile not found'; end if;
 if target_user=(select auth.uid()) then raise exception 'Self role changes are not allowed'; end if;
 if not(actor_role='super_admin' or (actor_role='admin' and target_role in ('user','sales_rep') and new_role in ('user','sales_rep'))) then raise exception 'Not authorised'; end if;
 update public.profiles set role=new_role,location_id=case when new_role='sales_rep' then new_location else null end where user_id=target_user;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,details) values(auth.uid(),'assign_role','profiles',target_user::text,jsonb_build_object('old',target_role,'new',new_role,'location',new_location));
end $$;

-- Atomic, location-authorised manual stock adjustment with an immutable log.
create function public.adjust_inventory(target_variant uuid, target_location uuid, delta integer, reason text)
returns integer language plpgsql security definer set search_path='' as $$
declare item public.inventory; new_quantity integer;
begin
 if not adire_private.can_location(target_location) then raise exception 'Not authorised for this location'; end if;
 if delta is null or delta=0 or reason is null or length(trim(reason))<3 then raise exception 'Supply a non-zero adjustment and reason'; end if;
 insert into public.inventory(variant_id,location_id) values(target_variant,target_location) on conflict(variant_id,location_id) do nothing;
 select * into item from public.inventory where variant_id=target_variant and location_id=target_location for update;
 new_quantity=item.quantity+delta;
 if new_quantity<item.reserved then raise exception 'Insufficient unreserved stock'; end if;
 update public.inventory set quantity=new_quantity where id=item.id;
 insert into public.inventory_logs(inventory_id,variant_id,location_id,change_qty,previous_qty,resulting_qty,reason,created_by)
 values(item.id,target_variant,target_location,delta,item.quantity,new_quantity,reason,auth.uid());
 return new_quantity;
end $$;

-- Public stock API deliberately returns only availability, never counts or location information.
create function public.product_availability(target_product uuid)
returns table(variant_id uuid,in_stock boolean) language sql stable security definer set search_path='' as $$
 select v.id, exists(select 1 from public.inventory i join public.locations l on l.id=i.location_id where i.variant_id=v.id and l.active and i.quantity>i.reserved)
 from public.product_variants v join public.products p on p.id=v.product_id
 where p.id=target_product and p.status='active' and v.active
$$;

-- 10. Explicit grants and RLS on EVERY project table. No implicit client privileges.
do $$ declare item record; begin
 for item in select tablename from pg_tables where schemaname='public' and tablename in (
 'locations','profiles','addresses','categories','collections','tags','products','product_variants','product_images','product_tags','product_collections','related_products',
 'inventory','inventory_logs','carts','cart_items','wishlist_items','shipping_zones','shipping_rates','orders','order_items','stock_reservations','payments','payment_events','shipments','order_events','return_requests','refunds',
 'custom_orders','custom_order_files','measurements','consultations','quotations','blog_categories','blog_posts','blog_tags','blog_post_tags','site_pages','site_content','store_settings','newsletter_subscribers','contact_messages','reviews','notifications','ai_conversations','ai_messages','audit_logs') loop
 execute format('alter table public.%I enable row level security',item.tablename);
 execute format('revoke all on public.%I from anon, authenticated',item.tablename);
 execute format('grant all on public.%I to service_role',item.tablename);
 execute format('grant select on public.%I to authenticated',item.tablename);
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name=item.tablename and column_name='updated_at') then
 execute format('create trigger adire_touch before update on public.%I for each row execute function adire_private.touch_updated()',item.tablename);
 end if;
 end loop;
end $$;

-- Centrally managed nonfinancial content.
do $$ declare t text; begin
 foreach t in array array['categories','collections','tags','products','product_variants','product_images','product_tags','product_collections','related_products','blog_categories','blog_posts','blog_tags','blog_post_tags','site_pages','reviews'] loop
 execute format('grant insert,update,delete on public.%I to authenticated',t);
 execute format('create policy manager_all on public.%I for all to authenticated using (adire_private.is_manager()) with check (adire_private.is_manager())',t);
 end loop;
end $$;
-- Owner-level settings only.
do $$ declare t text; begin
 foreach t in array array['locations','shipping_zones','shipping_rates','site_content','store_settings'] loop
 execute format('grant insert,update,delete on public.%I to authenticated',t);
 execute format('create policy owner_all on public.%I for all to authenticated using (adire_private.role_name()=''super_admin'') with check (adire_private.role_name()=''super_admin'')',t);
 end loop;
end $$;

grant select on public.categories,public.collections,public.tags,public.products,public.product_variants,public.product_images,public.product_tags,public.product_collections,public.related_products,public.blog_categories,public.blog_posts,public.blog_tags,public.blog_post_tags,public.site_pages,public.site_content to anon;
create policy public_categories on public.categories for select to anon,authenticated using(active);
create policy public_collections on public.collections for select to anon,authenticated using(published);
create policy public_tags on public.tags for select to anon,authenticated using(true);
create policy public_products on public.products for select to anon,authenticated using(status='active');
create policy public_variants on public.product_variants for select to anon,authenticated using(active and exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy public_images on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy public_product_tags on public.product_tags for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active'));
create policy public_product_collections on public.product_collections for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active') and exists(select 1 from public.collections c where c.id=collection_id and c.published));
create policy public_related on public.related_products for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='active') and exists(select 1 from public.products p where p.id=related_id and p.status='active'));
create policy public_blog_categories on public.blog_categories for select to anon,authenticated using(true);
create policy public_blog_tags on public.blog_tags for select to anon,authenticated using(true);
create policy public_blog_posts on public.blog_posts for select to anon,authenticated using(status='published' and published_at<=now());
create policy public_blog_post_tags on public.blog_post_tags for select to anon,authenticated using(exists(select 1 from public.blog_posts p where p.id=post_id and p.status='published' and p.published_at<=now()));
create policy public_pages on public.site_pages for select to anon,authenticated using(published);
create policy public_content on public.site_content for select to anon,authenticated using(published);

-- Profile UPDATE grant omits role, location and identity columns.
grant update(full_name,phone,avatar_path) on public.profiles to authenticated;
create policy own_profile_read on public.profiles for select to authenticated using(user_id=auth.uid() or adire_private.is_manager() or exists(select 1 from public.orders o where o.customer_id=profiles.user_id and adire_private.can_location(o.location_id)));
create policy own_profile_update on public.profiles for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant insert,update,delete on public.addresses,public.carts,public.cart_items,public.wishlist_items,public.measurements to authenticated;
do $$ declare t text; begin
 foreach t in array array['addresses','carts','wishlist_items','measurements'] loop
 execute format('create policy own_rows on public.%I for all to authenticated using (customer_id=auth.uid()) with check (customer_id=auth.uid())',t);
 end loop;
end $$;
create policy own_cart_items on public.cart_items for all to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=auth.uid())) with check(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=auth.uid()) and exists(select 1 from public.product_variants v join public.products p on p.id=v.product_id where v.id=variant_id and v.active and p.status='active'));
create policy stock_read on public.inventory for select to authenticated using(adire_private.can_location(location_id));
create policy stock_logs_read on public.inventory_logs for select to authenticated using(adire_private.can_location(location_id));
create policy locations_staff_read on public.locations for select to authenticated using(adire_private.can_location(id));
create policy orders_read on public.orders for select to authenticated using(customer_id=auth.uid() or adire_private.can_location(location_id));
do $$ declare t text; begin
 foreach t in array array['order_items','shipments','order_events','payments'] loop
 execute format('create policy order_read on public.%I for select to authenticated using (adire_private.can_order(order_id))',t);
 end loop;
end $$;
-- Financial reconciliation and reservation records: no customer or sales-rep access.
create policy reservations_manager_read on public.stock_reservations for select to authenticated using(adire_private.is_manager());
create policy payment_events_owner_read on public.payment_events for select to authenticated using(adire_private.role_name()='super_admin');
create policy refunds_manager_read on public.refunds for select to authenticated using(adire_private.is_manager());
grant insert on public.return_requests to authenticated;
create policy returns_read on public.return_requests for select to authenticated using(customer_id=auth.uid() or adire_private.is_manager());
create policy returns_create on public.return_requests for insert to authenticated with check(customer_id=auth.uid() and status='requested' and exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid() and o.status in ('paid','processing','shipped','delivered')));

grant insert on public.custom_orders,public.custom_order_files to authenticated;
create policy custom_read on public.custom_orders for select to authenticated using(customer_id=auth.uid() or adire_private.can_location(location_id));
create policy custom_submit on public.custom_orders for insert to authenticated with check(customer_id=auth.uid() and guest_email is null and status='submitted' and location_id is null);
create policy custom_files_read on public.custom_order_files for select to authenticated using(adire_private.can_custom(custom_order_id));
create policy custom_files_insert on public.custom_order_files for insert to authenticated with check(owner_id=auth.uid() and split_part(storage_path,'/',1)=auth.uid()::text and exists(select 1 from public.custom_orders c where c.id=custom_order_id and c.customer_id=auth.uid()));
create policy consultations_read on public.consultations for select to authenticated using(adire_private.can_custom(custom_order_id));
create policy quotations_read on public.quotations for select to authenticated using(adire_private.is_manager() or (status<>'draft' and adire_private.can_custom(custom_order_id)));

-- Reviews expose the display name, but not a public customer identifier.
grant select(id,product_id,rating,title,body,display_name,status,created_at) on public.reviews to anon;
grant insert on public.reviews to authenticated;
create policy reviews_read on public.reviews for select to anon,authenticated using(status='approved' or customer_id=auth.uid());
create policy reviews_submit on public.reviews for insert to authenticated with check(customer_id=auth.uid() and status='pending');
grant update(read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using(customer_id=auth.uid());
create policy notifications_mark_read on public.notifications for update to authenticated using(customer_id=auth.uid()) with check(customer_id=auth.uid());
create policy newsletter_manager_read on public.newsletter_subscribers for select to authenticated using(adire_private.is_manager());
create policy contact_read on public.contact_messages for select to authenticated using(customer_id=auth.uid() or adire_private.is_manager());
create policy ai_conversation_read on public.ai_conversations for select to authenticated using(customer_id=auth.uid() or adire_private.is_manager());
create policy ai_messages_read on public.ai_messages for select to authenticated using(exists(select 1 from public.ai_conversations c where c.id=conversation_id and (c.customer_id=auth.uid() or adire_private.is_manager())));
create policy audit_read on public.audit_logs for select to authenticated using(adire_private.role_name()='super_admin');

revoke all on all functions in schema adire_private from public;
grant execute on function adire_private.role_name(),adire_private.is_manager(),adire_private.can_location(uuid),adire_private.can_order(uuid),adire_private.can_custom(uuid) to authenticated;
grant execute on function adire_private.is_manager() to anon;
revoke all on function public.assign_staff_role(uuid,text,uuid),public.adjust_inventory(uuid,uuid,integer,text),public.product_availability(uuid) from public;
grant execute on function public.assign_staff_role(uuid,text,uuid),public.adjust_inventory(uuid,uuid,integer,text) to authenticated;
grant execute on function public.product_availability(uuid) to anon,authenticated,service_role;

-- 11. Storage: public published media, separate private drafts and customer inspiration.
-- Public bucket files are public even when their associated row is a draft.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp']),
 ('journal-images','journal-images',true,10485760,array['image/jpeg','image/png','image/webp']),
 ('site-assets','site-assets',true,10485760,array['image/jpeg','image/png','image/webp']),
 ('draft-media','draft-media',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('custom-inspiration','custom-inspiration',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']);
create policy adire_media_manage on storage.objects for all to authenticated
 using(bucket_id in ('product-images','journal-images','draft-media') and adire_private.is_manager())
 with check(bucket_id in ('product-images','journal-images','draft-media') and adire_private.is_manager());
create policy adire_site_assets_manage on storage.objects for all to authenticated
 using(bucket_id='site-assets' and adire_private.role_name()='super_admin')
 with check(bucket_id='site-assets' and adire_private.role_name()='super_admin');
create policy adire_private_files_owner on storage.objects for all to authenticated
 using(bucket_id in ('custom-inspiration','avatars') and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id in ('custom-inspiration','avatars') and (storage.foldername(name))[1]=auth.uid()::text);
create policy adire_custom_files_manager on storage.objects for select to authenticated
 using(bucket_id='custom-inspiration' and adire_private.is_manager());

-- 12. Starter taxonomy only; never invent products, prices, stock, addresses or payment credentials.
insert into public.locations(name,slug) values ('Online Store','online');
insert into public.categories(name,slug,department) values
 ('Women','women','women'),('Men','men','men'),('Kids','kids','kids'),('Accessories','accessories','accessories'),('Fabrics','fabrics','fabrics');
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,'women-'||c.slug,'women' from public.categories p cross join (values
 ('Dresses','dresses'),('Bubu','bubu'),('Two Piece','two-piece'),('Tops','tops'),('Pants','pants'),('Jackets','jackets'),('Jumpsuits','jumpsuits'),('Kimono','kimono')) c(name,slug) where p.slug='women';
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,'men-'||c.slug,'men' from public.categories p cross join (values
 ('Two Piece Sets','two-piece'),('Pants','pants'),('Jackets','jackets'),('Shorts','shorts'),('T-Shirts','t-shirts')) c(name,slug) where p.slug='men';
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,'accessories-'||c.slug,'accessories' from public.categories p cross join (values
 ('Handbags','handbags'),('Laptop Bags','laptop-bags'),('Travel Bags','travel-bags'),('Turbans','turbans')) c(name,slug) where p.slug='accessories';
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,p.slug||'-'||c.slug,p.department from public.categories p cross join (values
 ('Adire','adire'),('Aso Oke','aso-oke'),('Akwete','akwete'),('Cargo','cargo'),('Patchwork','patchwork')) c(name,slug) where p.slug in ('women-pants','men-pants');
insert into public.categories(parent_id,name,slug,department)
 select p.id,'Ankara','women-pants-ankara','women' from public.categories p where p.slug='women-pants';
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,p.slug||'-'||c.slug,p.department from public.categories p cross join (values
 ('Aso Oke','aso-oke'),('Cuba','cuba'),('Luxury','luxury')) c(name,slug) where p.slug in ('women-jackets','men-jackets');
insert into public.categories(parent_id,name,slug,department)
 select p.id,'Netted','women-jackets-netted','women' from public.categories p where p.slug='women-jackets';
insert into public.categories(parent_id,name,slug,department)
 select p.id,c.name,'women-dresses-'||c.slug,'women' from public.categories p cross join (values
 ('Cotton','cotton'),('Chiffon','chiffon'),('Silk','silk'),('Netted','netted'),('Stone','stone'),('Embroidered','embroidered'),('Spaghetti','spaghetti'),('Halter Neck','halter-neck')) c(name,slug) where p.slug='women-dresses';
insert into public.blog_categories(name,slug) values
 ('African Fashion & Style','african-fashion-style'),('Adire & African Fabrics','adire-african-fabrics'),
 ('Heritage & Culture','heritage-culture'),('Fashion Care & Guides','fashion-care-guides'),
 ('Custom Fashion','custom-fashion'),('Adire Teems Journal','adire-teems-journal');
insert into public.collections(name,slug,kind) select name,lower(replace(name,' ','-')),'fabric' from unnest(array['Adire','Aso Oke','Ankara','Akwete','Cotton','Silk','Damask','Linen','Cashmere','Milkado','Chiffon']) name;
insert into public.collections(name,slug,kind) select name,lower(replace(name,' ','-')),'occasion' from unnest(array['Wedding','Birthday','Church','Corporate','Dinner','Casual','Traditional','Picnic','Concert','Vacation']) name;
insert into public.tags(name,slug,kind) select name,slug,'fabric' from public.collections where kind='fabric';
insert into public.tags(name,slug,kind) select name,slug,'occasion' from public.collections where kind='occasion';
insert into public.collections(name,slug,kind) values ('New Arrivals','new-arrivals','editorial'),('Best Sellers','best-sellers','editorial'),('Sale','sale','promotion');
insert into public.tags(name,slug,kind) select name,lower(replace(name,' ','-')),'colour' from unnest(array['Black','White','Blue','Green','Red','Gold','Brown','Cream','Multi-colour']) name;
insert into public.tags(name,slug,kind) select name,lower(replace(name,' ','-')),'style' from unnest(array['Traditional','Contemporary','Luxury','Minimalist','Smart Casual']) name;
insert into public.tags(name,slug,kind) select name,lower(replace(name,' ','-')),'fit' from unnest(array['Oversized','Tailored','Relaxed']) name;
insert into public.tags(name,slug,kind) values ('Handmade','handmade','attribute'),('Made in Nigeria','made-in-nigeria','attribute');
insert into public.site_pages(slug,title) values
 ('shipping-policy','Shipping Policy'),('return-policy','Return Policy'),('privacy-policy','Privacy Policy'),
 ('terms','Terms'),('size-guide','Size Guide'),('faq','FAQ'),('about','Our Story');
insert into public.store_settings(key,value) values
 ('store_name','"Adire Teems"'),('base_currency','"NGN"'),('timezone','"Africa/Lagos"');

-- Mark version without touching Supabase's own migration tracking tables.
create index product_images_product on public.product_images(product_id,sort_order);
create index product_tags_tag on public.product_tags(tag_id);
create index product_collections_collection on public.product_collections(collection_id);
create index inventory_location on public.inventory(location_id);
create index inventory_logs_location_time on public.inventory_logs(location_id,created_at desc);
create index order_items_order on public.order_items(order_id);
create index payments_order on public.payments(order_id);
create index shipments_order on public.shipments(order_id);
create index order_events_order on public.order_events(order_id,created_at);
create index reservations_expiry on public.stock_reservations(expires_at) where status='held';
create index returns_customer on public.return_requests(customer_id);
create index custom_orders_customer on public.custom_orders(customer_id);
create index custom_orders_location on public.custom_orders(location_id);
create index custom_files_order on public.custom_order_files(custom_order_id);
create index consultations_custom_order on public.consultations(custom_order_id);
create index measurements_customer on public.measurements(customer_id);
create index ai_conversations_customer on public.ai_conversations(customer_id);
create index ai_messages_conversation on public.ai_messages(conversation_id,created_at);
create index notifications_customer on public.notifications(customer_id,created_at desc);
create index audit_entity on public.audit_logs(entity_type,entity_id,created_at desc);
create table adire_private.schema_version(version text primary key, installed_at timestamptz not null default now());
insert into adire_private.schema_version(version) values('20260914_01');
notify pgrst, 'reload schema';
commit;
