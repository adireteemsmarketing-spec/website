// Run: node supabase/tests/verify.mjs
// Test-only PostgreSQL engine: npm install --prefix supabase/tests/runtime @electric-sql/pglite
// Supabase-managed auth/storage objects are stubbed; never run the stubs on a real project.
import { PGlite } from './runtime/node_modules/@electric-sql/pglite/dist/index.js'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const db = new PGlite()
await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to anon,authenticated,service_role;
 grant usage on schema public to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated,service_role;
 grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
`)
try {
 await db.exec(await readFile(new URL('../01_setup.sql',import.meta.url),'utf8'))
 console.log('PASS: complete bootstrap executes on PostgreSQL')
 await db.exec(await readFile(new URL('../03_verify_setup.sql',import.meta.url),'utf8'))
 console.log('PASS: hosted verification SQL executes successfully')
 await db.exec(await readFile(new URL('../04_application_integration.sql',import.meta.url),'utf8'))
 console.log('PASS: application integration migration executes')
 await db.exec(await readFile(new URL('../05_customer_journey.sql',import.meta.url),'utf8'))
 console.log('PASS: customer journey migration executes')
} catch(error) { console.error('BOOTSTRAP FAILED:',error.message); if(error.position)console.error('Position:',error.position); await db.close(); process.exit(1) }
const ids={owner:'00000000-0000-0000-0000-000000000001',admin:'00000000-0000-0000-0000-000000000002',sales:'00000000-0000-0000-0000-000000000003',buyer:'00000000-0000-0000-0000-000000000004',other:'00000000-0000-0000-0000-000000000005'}
const row=async(sql)=> (await db.query(sql)).rows[0]
const count=async(sql)=>Number((await row(sql)).n)
async function as(role,user,fn){await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub','${user||''}',false);`);try{return await fn()}finally{await db.exec('reset role')}}
async function denied(sql){await assert.rejects(()=>db.exec(sql))}
for(const [name,id] of Object.entries(ids))await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${id}','${name}@example.test','{"role":"super_admin","full_name":"${name}"}');`)
assert.equal((await row(`select role from public.profiles where user_id='${ids.buyer}'`)).role,'user')
const location=(await row("select id from public.locations where slug='online'")).id
const second=(await row("insert into public.locations(name,slug) values('Second','second') returning id")).id
await db.exec(`update public.profiles set role='super_admin' where user_id='${ids.owner}';update public.profiles set role='admin' where user_id='${ids.admin}';update public.profiles set role='sales_rep',location_id='${location}' where user_id='${ids.sales}';`)
const product=(await row("insert into public.products(name,slug,department,base_price,status) values('Test','test','women',100,'active') returning id")).id
const draft=(await row("insert into public.products(name,slug,department,base_price,status) values('Draft','draft','women',100,'draft') returning id")).id
const variant=(await row(`insert into public.product_variants(product_id,sku) values('${product}','TEST') returning id`)).id
await db.exec(`insert into public.inventory(variant_id,location_id,quantity) values('${variant}','${location}',10),('${variant}','${second}',4);`)
await as('anon',null,async()=>{
 assert.equal(await count('select count(*) n from public.products'),1)
 await denied('select * from public.inventory')
 assert.equal((await row(`select * from public.product_availability('${product}')`)).in_stock,true)
 assert.equal((await db.query(`select * from public.product_availability('${draft}')`)).rows.length,0)
 await denied("insert into public.products(name,slug,department,base_price) values('x','x','women',0)")
})
await as('authenticated',ids.buyer,async()=>{
 assert.equal(await count('select count(*) n from public.profiles'),1)
 await denied(`update public.profiles set role='super_admin' where user_id='${ids.buyer}'`)
 await denied(`select public.assign_staff_role('${ids.other}','admin',null)`)
 await denied(`select public.adjust_inventory('${variant}','${location}',1,'attempt')`)
 await db.exec(`update public.profiles set full_name='Updated name' where user_id='${ids.buyer}'`)
 await denied(`insert into public.addresses(customer_id,full_name,line1,city,country_code) values('${ids.other}','Other','Street','City','NG')`)
})
await as('authenticated',ids.sales,async()=>{
 assert.equal(await count('select count(*) n from public.inventory'),1)
 assert.equal(Number((await row(`select public.adjust_inventory('${variant}','${location}',-2,'Sold at counter') qty`)).qty),8)
 await denied(`select public.adjust_inventory('${variant}','${second}',1,'Wrong location')`)
 await denied(`select public.adjust_inventory('${variant}','${location}',-999,'Negative stock')`)
 await denied('update public.inventory set quantity=999')
 assert.equal(await count('select count(*) n from public.inventory_logs'),1)
 await denied('delete from public.inventory_logs')
})
await as('authenticated',ids.admin,async()=>{
 assert.equal(await count('select count(*) n from public.products'),2)
 await db.exec(`select public.assign_staff_role('${ids.other}','sales_rep','${second}')`)
 await denied(`select public.assign_staff_role('${ids.buyer}','admin',null)`)
 await db.exec("update public.products set name='Edited' where slug='test'")
})
const order=(await row(`insert into public.orders(order_number,customer_id,location_id,subtotal,total,currency,shipping_address) values('AT-TEST','${ids.buyer}','${second}',100,100,'NGN','{}') returning id`)).id
await as('authenticated',ids.buyer,async()=>{
 assert.equal(await count('select count(*) n from public.orders'),1)
 await denied(`update public.orders set status='paid' where id='${order}'`)
 await denied(`insert into public.orders(order_number,customer_id,location_id,subtotal,total,currency,shipping_address) values('FORGED','${ids.buyer}','${location}',1,1,'NGN','{}')`)
})
await as('authenticated',ids.sales,async()=>assert.equal(await count('select count(*) n from public.orders'),0))
await as('authenticated',ids.other,async()=>assert.equal(await count('select count(*) n from public.orders'),1))
await db.exec("insert into public.blog_posts(slug,title,author_name,status,published_at) values('live','Live','Author','published',now()),('future','Future','Author','published',now()+interval '1 day'),('draft','Draft','Author','draft',null)")
await as('anon',null,async()=>assert.equal(await count('select count(*) n from public.blog_posts'),1))
await as('authenticated',ids.buyer,async()=>{
 await db.exec(`insert into storage.objects(bucket_id,name) values('custom-inspiration','${ids.buyer}/test.webp')`)
 await denied(`insert into storage.objects(bucket_id,name) values('custom-inspiration','${ids.other}/test.webp')`)
 await denied(`insert into storage.objects(bucket_id,name) values('product-images','test.webp')`)
})
await as('authenticated',ids.other,async()=>assert.equal(await count('select count(*) n from storage.objects'),0))
const tables=await db.query("select tablename,rowsecurity from pg_tables where schemaname='public'")
assert(tables.rows.every(t=>t.rowsecurity))
console.log(`PASS: ${tables.rows.length} project tables have RLS`)
console.log('PASS: signup metadata cannot promote users; profile/role/customer/order boundaries')
console.log('PASS: staff location scope, logged stock adjustment, no negative stock or direct stock edits')
console.log('PASS: published/draft/scheduled content visibility and private image ownership')
const savedId='10000000-0000-0000-0000-000000000001'
const category=(await row('select slug from public.categories limit 1')).slug
const payload={id:savedId,name:'Integration product',slug:'integration-product',description:'Description',category,department:'women',fabric:'Adire',price:12000,currency:'NGN',status:'published',sizes:['S','M'],sku:'INTEGRATION',image:'draft-media/test.webp',styleGroup:'',style:''}
const sqlPayload=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb"
await as('authenticated',ids.buyer,async()=>await denied(`select public.save_catalogue_product(${sqlPayload(payload)})`))
await as('authenticated',ids.admin,async()=>{
 await db.exec(`select public.save_catalogue_product(${sqlPayload(payload)})`)
 assert.equal(await count(`select count(*) n from public.product_variants where product_id='${savedId}'`),2)
 const v=(await row(`select id from public.product_variants where product_id='${savedId}' and size='M'`)).id
 await db.exec(`select public.adjust_inventory('${v}','${location}',3,'Opening stock')`)
 await denied(`select public.save_catalogue_product(${sqlPayload({...payload,name:'Must roll back',sizes:['S']})})`)
 assert.equal((await row(`select name from public.products where id='${savedId}'`)).name,payload.name)
 await db.exec(`select public.save_catalogue_product(${sqlPayload({...payload,price:15000})})`)
 assert.equal(await count(`select count(*) n from public.product_variants where product_id='${savedId}'`),2)
 assert.equal(await count(`select count(*) n from public.product_images where product_id='${savedId}'`),1)
 await denied("insert into public.store_settings(key,value) values('forbidden','{}')")
})
const contact={id:'20000000-0000-0000-0000-000000000001',name:'Buyer',email:'buyer@example.test',subject:'Enquiry',message:'Hello',recipient:'owner@example.test'}
await as('anon',null,async()=>await denied(`select public.submit_contact(${sqlPayload(contact)})`))
await as('service_role',null,async()=>{
 await db.exec(`select public.submit_contact(${sqlPayload(contact)})`)
 await db.exec(`select public.submit_contact(${sqlPayload(contact)})`)
 assert.equal(await count(`select count(*) n from public.contact_messages where id='${contact.id}'`),1)
 await denied(`select public.submit_contact(${sqlPayload({...contact,message:'Changed'})})`)
})
await as('authenticated',ids.admin,async()=>{
 await db.exec(`update public.contact_messages set notes='Follow up',status='open' where id='${contact.id}'`)
 await denied(`update public.contact_messages set notification='{}' where id='${contact.id}'`)
})
await as('authenticated',ids.buyer,async()=>assert.equal(await count(`select count(*) n from public.contact_messages where id='${contact.id}'`),0))
console.log('PASS: atomic catalogue saves, stock preservation, contact idempotency and manager permissions')
const checkoutProduct=(await row("insert into public.products(name,slug,department,base_price,status) values('Journey test','journey-test','women',25000,'active') returning id")).id
const checkoutVariant=(await row(`insert into public.product_variants(product_id,sku,size) values('${checkoutProduct}','JOURNEY-M','M') returning id`)).id
await db.exec(`insert into public.inventory(variant_id,location_id,quantity) values('${checkoutVariant}','${location}',5)`)
const bag=[{productId:checkoutProduct,size:'M',quantity:2}]
const shipping={name:'Test Buyer',email:'buyer@example.test',phone:'12345',address:'Test street',city:'Lagos',state:'Lagos',country:'Nigeria'}
const requestKey='30000000-0000-0000-0000-000000000001'
let checkoutOrder
await as('anon',null,async()=>await denied(`select public.place_customer_order(${sqlPayload(bag)},${sqlPayload(shipping)},'${requestKey}')`))
await as('authenticated',ids.buyer,async()=>{
 await db.exec(`select public.save_customer_cart(${sqlPayload(bag)})`)
 assert.equal(await count('select count(*) n from public.cart_items'),1)
 checkoutOrder=(await row(`select public.place_customer_order(${sqlPayload(bag)},${sqlPayload(shipping)},'${requestKey}') id`)).id
 assert.equal((await row(`select public.place_customer_order(${sqlPayload(bag)},${sqlPayload(shipping)},'${requestKey}') id`)).id,checkoutOrder)
 assert.equal(Number((await row(`select subtotal from public.orders where id='${checkoutOrder}'`)).subtotal),50000)
 assert.equal(await count('select count(*) n from public.cart_items'),0)
 await denied(`select public.update_customer_delivery('${checkoutOrder}','delivered','{}')`)
 await denied(`select public.place_customer_order(${sqlPayload([{...bag[0],quantity:10}])},${sqlPayload(shipping)},'30000000-0000-0000-0000-000000000002')`)
})
await as('authenticated',ids.other,async()=>{
 assert.equal(await count(`select count(*) n from public.orders where id='${checkoutOrder}'`),0)
 assert.equal(await count(`select count(*) n from public.order_items where order_id='${checkoutOrder}'`),0)
 assert.equal(await count(`select count(*) n from public.order_events where order_id='${checkoutOrder}'`),0)
 assert.equal(await count('select count(*) n from public.cart_items'),0)
})
assert.equal(Number((await row(`select reserved from public.inventory where variant_id='${checkoutVariant}'`)).reserved),2)
await as('authenticated',ids.admin,async()=>{
 await denied(`select public.update_customer_delivery('${checkoutOrder}','delivered','{}')`)
 for(const status of ['processing','shipped','out_for_delivery','delivered']) await db.exec(`select public.update_customer_delivery('${checkoutOrder}','${status}',${sqlPayload({carrier:'Test carrier',location:'Lagos',trackingNumber:'TEST-001',note:'Test update'})})`)
 assert.equal((await row(`select status from public.orders where id='${checkoutOrder}'`)).status,'delivered')
 assert.equal((await row(`select status from public.shipments where order_id='${checkoutOrder}'`)).status,'delivered')
})
assert.equal(Number((await row(`select quantity from public.inventory where variant_id='${checkoutVariant}'`)).quantity),3)
assert.equal(Number((await row(`select reserved from public.inventory where variant_id='${checkoutVariant}'`)).reserved),0)
let cancelledOrder
await as('authenticated',ids.buyer,async()=>{cancelledOrder=(await row(`select public.place_customer_order(${sqlPayload(bag)},${sqlPayload(shipping)},'30000000-0000-0000-0000-000000000003') id`)).id})
await as('authenticated',ids.admin,async()=>await db.exec(`select public.update_customer_delivery('${cancelledOrder}','cancelled','{}')`))
assert.equal(Number((await row(`select reserved from public.inventory where variant_id='${checkoutVariant}'`)).reserved),0)
assert.equal(Number((await row(`select quantity from public.inventory where variant_id='${checkoutVariant}'`)).quantity),3)
console.log('PASS: customer cart, checkout pricing, duplicate prevention, ownership, stock reservation, delivery progression and cancellation')
await db.exec(await readFile(new URL('../06_paystack_payments.sql',import.meta.url),'utf8'))
await db.exec(await readFile(new URL('../06_paystack_payments.sql',import.meta.url),'utf8'))
let paymentOrder, attempt
await as('authenticated',ids.buyer,async()=>{
 paymentOrder=(await row(`select public.place_paystack_order(${sqlPayload([{...bag[0],quantity:1}])},${sqlPayload(shipping)},'30000000-0000-0000-0000-000000000004') id`)).id
 await denied(`select public.prepare_paystack_payment('${paymentOrder}','${ids.buyer}','test')`)
 await denied(`select public.settle_paystack_payment('forged',2500000,'NGN','test')`)
})
await as('authenticated',ids.admin,async()=>await denied(`select public.update_customer_delivery('${paymentOrder}','processing','{}')`))
await as('service_role',null,async()=>{
 await denied(`select public.prepare_paystack_payment('${paymentOrder}','${ids.other}','test')`)
 attempt=(await row(`select public.prepare_paystack_payment('${paymentOrder}','${ids.buyer}','test') value`)).value
 assert.equal(Number(attempt.amount),25000)
 await denied(`select public.prepare_paystack_payment('${paymentOrder}','${ids.buyer}','test')`)
 await denied(`select public.settle_paystack_payment('${attempt.reference}',1,'NGN','test')`)
 await denied(`select public.settle_paystack_payment('${attempt.reference}',2500000,'USD','test')`)
 await denied(`select public.settle_paystack_payment('${attempt.reference}',2500000,'NGN','live')`)
 await db.exec(`update payments set checkout_url='https://checkout.paystack.com/test' where id='${attempt.id}'`)
 assert.equal((await row(`select public.prepare_paystack_payment('${paymentOrder}','${ids.buyer}','test') value`)).value.reference,attempt.reference)
 for(let i=0;i<2;i++) await db.exec(`select public.settle_paystack_payment('${attempt.reference}',2500000,'NGN','test')`)
 assert.equal((await row(`select status from orders where id='${paymentOrder}'`)).status,'paid')
 assert.equal(await count(`select count(*) n from payment_events where payment_id='${attempt.id}'`),1)
 assert.equal(await count(`select count(*) n from order_events where order_id='${paymentOrder}' and status='paid'`),1)
 await denied(`select public.prepare_paystack_payment('${paymentOrder}','${ids.buyer}','test')`)
})
await as('authenticated',ids.other,async()=>assert.equal(await count(`select count(*) n from payments where order_id='${paymentOrder}'`),0))
await as('authenticated',ids.admin,async()=>await db.exec(`select public.update_customer_delivery('${paymentOrder}','processing','{}')`))
await as('service_role',null,async()=>{
 await db.exec(`select public.settle_paystack_payment('${attempt.reference}',2500000,'NGN','test')`)
 assert.equal((await row(`select status from orders where id='${paymentOrder}'`)).status,'processing')
})
console.log('PASS: Paystack ownership, settlement validation, idempotency, payment RLS and unpaid dispatch guard')
let lateOrder, lateAttempt
await as('authenticated',ids.buyer,async()=>{
 lateOrder=(await row(`select public.place_paystack_order(${sqlPayload([{...bag[0],quantity:1}])},${sqlPayload(shipping)},'30000000-0000-0000-0000-000000000005') id`)).id
})
await as('service_role',null,async()=>{
 lateAttempt=(await row(`select public.prepare_paystack_payment('${lateOrder}','${ids.buyer}','test') value`)).value
})
await as('authenticated',ids.admin,async()=>await db.exec(`select public.update_customer_delivery('${lateOrder}','cancelled','{}')`))
await as('service_role',null,async()=>{
 await db.exec(`select public.settle_paystack_payment('${lateAttempt.reference}',2500000,'NGN','test')`)
 assert.equal((await row(`select status from orders where id='${lateOrder}'`)).status,'cancelled')
 assert.equal((await row(`select status from payments where id='${lateAttempt.id}'`)).status,'successful')
 assert.equal(await count(`select count(*) n from stock_reservations where order_id='${lateOrder}' and status='held'`),0)
 await db.exec(`insert into payments(order_id,provider,reference,amount,currency,provider_mode) values('${paymentOrder}','paystack','duplicate-attempt',25000,'NGN','test')`)
 await db.exec(`select public.settle_paystack_payment('duplicate-attempt',2500000,'NGN','test')`)
 assert.equal((await row(`select status from orders where id='${paymentOrder}'`)).status,'processing')
 assert.equal(await count(`select count(*) n from payments where order_id='${paymentOrder}' and status='successful'`),2)
 assert.equal(await count(`select count(*) n from order_events where order_id='${paymentOrder}' and customer_note like 'An additional payment%'`),1)
})
console.log('PASS: late payment preserves cancellation and duplicate payment is recorded without repeating fulfilment')
await db.close()
