-- Apply after 04_application_integration.sql in the Supabase SQL Editor.
begin;
alter table public.orders add column if not exists checkout_key uuid;
create unique index if not exists orders_checkout_key on public.orders(customer_id,checkout_key);
alter table public.shipments add column if not exists estimated_delivery date;
alter table public.shipments add column if not exists current_location text;
alter table public.shipments drop constraint if exists shipments_status_check;
alter table public.shipments add constraint shipments_status_check check(status in ('pending','shipped','out_for_delivery','delivered','failed','returned'));

create or replace function public.save_customer_cart(items jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare cart uuid; item jsonb; variant uuid;
begin
 if auth.uid() is null then raise exception 'Sign in to save your bag.'; end if;
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>50 then raise exception 'Invalid bag.'; end if;
   insert into carts(customer_id) values(auth.uid()) on conflict(customer_id) do nothing;
    select id into cart from carts where customer_id=auth.uid() for update;
     delete from cart_items where cart_id=cart;
      for item in select value from jsonb_array_elements(items) loop
        if (item->>'quantity')!~'^[1-9][0-9]*$' or (item->>'quantity')::int>10 then raise exception 'Invalid quantity.'; end if;
          select v.id into variant from product_variants v join products p on p.id=v.product_id
             where p.id=(item->>'productId')::uuid and v.size=item->>'size' and p.status='active' and v.active order by v.id limit 1;
               if variant is null then raise exception 'A selected product is no longer available. Update your bag.'; end if;
                 insert into cart_items(cart_id,variant_id,quantity) values(cart,variant,(item->>'quantity')::int);
                  end loop;
                   update carts set updated_at=now() where id=cart;
                   end $$;

                   create or replace function public.place_customer_order(items jsonb, shipping jsonb, request_key uuid) returns uuid
                   language plpgsql security definer set search_path=public,pg_temp as $$
                   declare result uuid; location uuid; item jsonb; entry record; total_amount numeric=0; code text; lines jsonb='[]'; inv record;
                   begin
                    if auth.uid() is null then raise exception 'Sign in before placing an order.'; end if;
                     if request_key is null then raise exception 'Missing checkout reference.'; end if;
                      perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
                       select id into result from orders where customer_id=auth.uid() and checkout_key=request_key;
                        if result is not null then return result; end if;
                         if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Your bag is empty or too large.'; end if;
                          if jsonb_typeof(shipping)<>'object' or exists(select 1 from unnest(array['name','email','phone','address','city','state','country']) k where length(trim(coalesce(shipping->>k,''))) not between 1 and 200) then raise exception 'Complete your contact and shipping details.'; end if;
                           for item in select value from jsonb_array_elements(items) loop
                             if (item->>'quantity')!~'^[1-9][0-9]*$' or (item->>'quantity')::int>10 then raise exception 'Invalid quantity.'; end if;
                               select v.id,v.sku,v.size,v.color,p.name,coalesce(v.price_override,p.base_price) price,p.currency into entry
                                  from product_variants v join products p on p.id=v.product_id
                                     where p.id=(item->>'productId')::uuid and v.size=item->>'size' and p.status='active' and v.active order by v.id limit 1;
                                       if not found then raise exception 'A selected product is unavailable.'; end if;
                                         if code is not null and code<>entry.currency then raise exception 'Please check out products in one currency at a time.'; end if;
                                           if exists(select 1 from jsonb_array_elements(lines) l where l->>'id'=entry.id::text) then raise exception 'Duplicate bag item.'; end if;
                                             code=entry.currency; total_amount=total_amount+entry.price*(item->>'quantity')::int;
                                               lines=lines||jsonb_build_array(to_jsonb(entry)||jsonb_build_object('quantity',(item->>'quantity')::int));
                                                end loop;
                                                 select l.id into location from locations l where l.active and not exists(
                                                   select 1 from jsonb_array_elements(lines) x where not exists(select 1 from inventory i where i.location_id=l.id and i.variant_id=(x->>'id')::uuid and i.quantity-i.reserved >= (x->>'quantity')::int)
                                                    ) order by l.id limit 1;
                                                     if location is null then raise exception 'There is not enough stock to fulfil this bag from one location. Please update your bag or contact us.'; end if;
                                                      perform id from inventory where location_id=location and variant_id in (select (x->>'id')::uuid from jsonb_array_elements(lines) x) order by id for update;
                                                       result=gen_random_uuid();
                                                        insert into orders(id,order_number,customer_id,location_id,subtotal,total,currency,shipping_address,payment_provider,checkout_key)
                                                         values(result,'ADR-'||upper(replace(result::text,'-','')),auth.uid(),location,total_amount,total_amount,code,shipping,'manual',request_key);
                                                          for item in select value from jsonb_array_elements(lines) loop
                                                            select * into inv from inventory where location_id=location and variant_id=(item->>'id')::uuid;
                                                              if inv.quantity-inv.reserved<(item->>'quantity')::int then raise exception 'Stock changed. Please review your bag.'; end if;
                                                                insert into order_items(order_id,variant_id,product_name,sku,size,color,quantity,unit_price)
                                                                   values(result,(item->>'id')::uuid,item->>'name',item->>'sku',item->>'size',item->>'color',(item->>'quantity')::int,(item->>'price')::numeric);
                                                                     update inventory set reserved=reserved+(item->>'quantity')::int where id=inv.id;
                                                                       insert into stock_reservations(order_id,inventory_id,quantity,expires_at) values(result,inv.id,(item->>'quantity')::int,'infinity');
                                                                        end loop;
                                                                         insert into order_events(order_id,status,customer_note) values(result,'pending','Order request received. Payment and delivery charges will be confirmed by our team. No payment has been taken.');
                                                                          delete from cart_items where cart_id in(select id from carts where customer_id=auth.uid());
                                                                           return result;
                                                                           end $$;

                                                                           create or replace function public.update_customer_delivery(target uuid, next_status text, details jsonb) returns void
                                                                           language plpgsql security definer set search_path=public,pg_temp as $$
                                                                           declare purchase orders; previous text; reservation record; shipment uuid;
                                                                           begin
                                                                            if not adire_private.is_manager() then raise exception 'Admin access required.'; end if;
                                                                             select * into purchase from orders where id=target for update;
                                                                              if not found then raise exception 'Order not found.'; end if;
                                                                               select status into previous from order_events where order_id=target order by created_at desc,id desc limit 1;
                                                                                previous=coalesce(previous,purchase.status);
                                                                                 if next_status<>previous and not (
                                                                                   (previous in ('pending','paid') and next_status in ('processing','cancelled')) or
                                                                                     (previous='processing' and next_status in ('shipped','cancelled')) or
                                                                                       (previous='shipped' and next_status in ('out_for_delivery','delivered')) or
                                                                                         (previous='out_for_delivery' and next_status='delivered')
                                                                                          ) then raise exception 'Invalid delivery status transition.'; end if;
                                                                                           if next_status in ('shipped','cancelled') and next_status<>previous then
                                                                                             for reservation in select r.*,i.quantity current_qty,i.variant_id,i.location_id from stock_reservations r join inventory i on i.id=r.inventory_id where r.order_id=target and r.status='held' order by i.id for update of i loop
                                                                                                update inventory set reserved=reserved-reservation.quantity,quantity=quantity-case when next_status='shipped' then reservation.quantity else 0 end where id=reservation.inventory_id;
                                                                                                   update stock_reservations set status=case when next_status='shipped' then 'consumed' else 'released' end where id=reservation.id;
                                                                                                      if next_status='shipped' then insert into inventory_logs(inventory_id,variant_id,location_id,change_qty,previous_qty,resulting_qty,reason,created_by) values(reservation.inventory_id,reservation.variant_id,reservation.location_id,-reservation.quantity,reservation.current_qty,reservation.current_qty-reservation.quantity,'Order dispatched',auth.uid()); end if;
                                                                                                        end loop;
                                                                                                         end if;
                                                                                                          update orders set status=case when next_status='out_for_delivery' then 'shipped' else next_status end where id=target;
                                                                                                           select id into shipment from shipments where order_id=target order by created_at limit 1;
                                                                                                            if shipment is null then insert into shipments(order_id) values(target) returning id into shipment; end if;
                                                                                                             update shipments set carrier=nullif(details->>'carrier',''),tracking_number=nullif(details->>'trackingNumber',''),tracking_url=nullif(details->>'trackingUrl',''),
                                                                                                               current_location=nullif(details->>'location',''),estimated_delivery=nullif(details->>'estimatedDelivery','')::date,
                                                                                                                 status=case when next_status in ('shipped','out_for_delivery','delivered') then next_status else 'pending' end,
                                                                                                                   shipped_at=case when next_status in ('shipped','out_for_delivery','delivered') then coalesce(shipped_at,now()) else shipped_at end,
                                                                                                                     delivered_at=case when next_status='delivered' then coalesce(delivered_at,now()) else delivered_at end where id=shipment;
                                                                                                                      insert into order_events(order_id,status,customer_note) values(target,next_status,nullif(details->>'note',''));
                                                                                                                      end $$;
                                                                                                                      revoke all on function public.save_customer_cart(jsonb),public.place_customer_order(jsonb,jsonb,uuid),public.update_customer_delivery(uuid,text,jsonb) from public,anon;
                                                                                                                      grant execute on function public.save_customer_cart(jsonb),public.place_customer_order(jsonb,jsonb,uuid),public.update_customer_delivery(uuid,text,jsonb) to authenticated;
                                                                                                                      notify pgrst,'reload schema';
                                                                                                                      commit;
                                                                                                                      