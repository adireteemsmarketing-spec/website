-- Run after 05_customer_journey.sql in the Supabase SQL Editor.
begin;
alter table public.payments add column if not exists checkout_url text;
alter table public.payments add column if not exists provider_mode text check (provider_mode in ('test','live'));

create or replace function public.place_paystack_order(items jsonb, shipping jsonb, request_key uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare target uuid;
begin
 target=public.place_customer_order(items,shipping,request_key);
 if exists(select 1 from orders where id=target and (currency<>'NGN' or total<=0)) then
  raise exception 'Paystack checkout currently supports positive NGN orders only.';
 end if;
 update orders set payment_provider='paystack' where id=target and status='pending';
 update order_events set customer_note='Order saved. Complete payment securely with Paystack. Delivery charges are arranged separately.'
 where order_id=target and status='pending' and customer_note like 'Order request received.%';
 return target;
end $$;
revoke all on function public.place_paystack_order(jsonb,jsonb,uuid) from public,anon;
grant execute on function public.place_paystack_order(jsonb,jsonb,uuid) to authenticated;

-- Only the trusted server may prepare or settle a payment. Prices always come from the order.
create or replace function public.prepare_paystack_payment(target uuid, buyer uuid, mode text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare purchase orders; attempt payments;
begin
 select * into purchase from orders where id=target and customer_id=buyer for update;
 if not found then raise exception 'Order not found.'; end if;
 if purchase.status<>'pending' or exists(select 1 from payments where order_id=target and status='successful') then
  raise exception 'This order is no longer awaiting payment.';
 end if;
 if purchase.currency<>'NGN' or purchase.total<=0 or mode not in ('test','live') or mode is null then raise exception 'Unsupported payment.'; end if;
 select * into attempt from payments where order_id=target and provider='paystack' and status='pending' and provider_mode=mode order by created_at desc limit 1;
 if attempt.id is not null and attempt.checkout_url is not null then
  return to_jsonb(attempt)||jsonb_build_object('email',purchase.shipping_address->>'email');
 end if;
 if attempt.id is not null and attempt.created_at>now()-interval '1 minute' then
  raise exception 'Payment checkout is being prepared. Wait a minute, then retry from your order.';
 end if;
 insert into payments(order_id,provider,reference,amount,currency,provider_mode)
 values(target,'paystack','ADR-'||replace(gen_random_uuid()::text,'-',''),purchase.total,purchase.currency,mode) returning * into attempt;
 update orders set payment_provider='paystack' where id=target;
 return to_jsonb(attempt)||jsonb_build_object('email',purchase.shipping_address->>'email');
end $$;

create or replace function public.settle_paystack_payment(payment_ref text, paid_amount bigint, paid_currency text, mode text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare attempt payments; purchase orders; target uuid; duplicate_payment boolean;
begin
 select order_id into target from payments where provider='paystack' and reference=payment_ref;
 if target is null then raise exception 'Payment not found.'; end if;
 select * into purchase from orders where id=target for update;
 select * into attempt from payments where provider='paystack' and reference=payment_ref for update;
 if paid_amount is null or paid_currency is null or mode is null or
    attempt.amount*100<>paid_amount or attempt.currency<>paid_currency or attempt.provider_mode<>mode or
    purchase.total<>attempt.amount or purchase.currency<>attempt.currency then raise exception 'Payment details do not match this order.'; end if;
 if attempt.status='successful' then return target; end if;
 if attempt.status='refunded' then raise exception 'Payment was already refunded.'; end if;
 duplicate_payment=exists(select 1 from payments where order_id=target and status='successful');
 update payments set status='successful',verified_at=now() where id=attempt.id;
 insert into payment_events(provider,provider_event_id,payment_id,processed_at)
 values('paystack','charge.success:'||payment_ref,attempt.id,now()) on conflict(provider,provider_event_id) do nothing;
 if purchase.status='pending' and not duplicate_payment then
  update orders set status='paid',payment_provider='paystack',payment_reference=payment_ref where id=target;
  insert into order_events(order_id,status,customer_note) values(target,'paid',case when mode='test' then 'Test payment confirmed by Paystack. No real money was charged.' else 'Payment confirmed by Paystack.' end);
 else
  -- Preserve cancelled/fulfilled orders and record late/duplicate receipts for staff review.
  insert into order_events(order_id,status,customer_note) values(target,purchase.status,
   case when duplicate_payment then 'An additional payment was received. Please contact support for a refund review.' else 'Payment received after the order status changed. Please contact support for review.' end);
 end if;
 return target;
end $$;
revoke all on function public.prepare_paystack_payment(uuid,uuid,text),public.settle_paystack_payment(text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.prepare_paystack_payment(uuid,uuid,text),public.settle_paystack_payment(text,bigint,text,text) to service_role;

-- Delivery updates must not dispatch an unpaid Paystack order.
create or replace function adire_private.guard_paystack_fulfilment() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.payment_provider='paystack' and new.status in ('paid','processing','shipped','delivered') and
 not exists(select 1 from payments where order_id=new.id and status='successful') then
  raise exception 'Paystack payment must be verified before preparing or dispatching this order.';
 end if;
 return new;
end $$;
drop trigger if exists guard_paystack_fulfilment on public.orders;
create trigger guard_paystack_fulfilment before update on public.orders for each row execute function adire_private.guard_paystack_fulfilment();
notify pgrst,'reload schema';
commit;
