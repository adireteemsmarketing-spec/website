import { randomUUID } from 'node:crypto'
import { validStyle } from '@/lib/styles'
import { adminSession, sameOrigin } from '@/lib/admin-auth'
import { readStore, check } from '@/lib/store-db'
import { storagePath } from '@/lib/storage'
export const dynamic='force-dynamic'
function text(value: unknown, name: string, max=500, required=true) { if(typeof value!=='string' || value.length>max || (required && !value.trim())) throw Error(`Enter a valid ${name}.`); return value.trim() }
function image(value: unknown) {const url=text(value,'image',2000); if(!(/^\/(?!\/)/.test(url)||/^https:\/\//.test(url))) throw Error('Use a local image path or HTTPS image URL.');return storagePath(url)}
function number(value: unknown,name:string) {if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100000000)throw Error(`Enter a valid ${name}.`);return value}
export async function GET() {
  try {if(!await adminSession())return Response.json({error:'Sign in to continue.'},{status:401});return Response.json(await readStore(true),{headers:{'Cache-Control':'no-store'}})}
  catch {return Response.json({error:'Store data is unavailable. Check the database setup.'},{status:503})}
}
export async function POST(request: Request) {
  if(!sameOrigin(request))return Response.json({error:'Invalid origin.'},{status:403})
  try {
    const session=await adminSession();if(!session)return Response.json({error:'Sign in to continue.'},{status:403})
    const db=session.db
    const raw=await request.text();if(raw.length>300000)throw Error('Request too large.')
    const {kind,action,data}=JSON.parse(raw)
    if(kind==='settings') {
      if(session.role!=='super_admin')return Response.json({error:'Only Super Admin can change settings.'},{status:403})
      const lowStock=number(data.lowStock,'low stock threshold');if(!Number.isInteger(lowStock))throw Error('Threshold must be a whole number.')
      const {error}=await db.from('store_settings').upsert({key:'storefront',value:{name:text(data.name,'store name'),email:text(data.email,'email',200,false),lowStock}});check(error)
    } else if(kind==='products'&&action==='stock') {
      if(!Number.isInteger(data.delta)||data.delta===0||Math.abs(data.delta)>1000000)throw Error('Enter a non-zero whole-number adjustment.')
      const {error}=await db.rpc('adjust_inventory',{target_variant:text(data.variantId,'variant'),target_location:text(data.locationId,'location'),delta:data.delta,reason:text(data.reason,'reason',500)});check(error)
    } else {
      if(kind!=='products'&&kind!=='posts')throw Error('Unknown section.')
      if(action==='delete') {
        // Archive rather than breaking historical orders and stock logs.
        const {error}=await db.from(kind==='products'?'products':'blog_posts').update({status:'archived'}).eq('id',text(data.id,'record ID')).select('id').single();check(error)
      } else if(action==='save') {
        const id=data.id||randomUUID(),slug=text(data.slug,'slug',150)
        if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Slug must use lowercase letters, numbers and hyphens.')
        const status=data.status==='published'?'published':'draft'
        if(kind==='products') {
          const styleGroup=text(data.styleGroup??'','style group',100,false),style=text(data.style??'','style',100,false)
          if(!validStyle(styleGroup,style))throw Error('Choose a style belonging to the selected style group.')
          const sizes=[...new Set(text(data.sizes,'sizes').split(',').map(s=>s.trim()).filter(Boolean))]
          if(!sizes.length||sizes.length>30)throw Error('Enter between 1 and 30 sizes.')
          const currency=text(data.currency,'currency',3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error('Enter a three-letter currency code.')
          const payload={id,slug,status,name:text(data.name,'name'),description:text(data.description,'description',10000),price:number(data.price,'price'),currency,sizes,image:image(data.image),fabric:text(data.fabric,'fabric'),category:text(data.category,'category'),department:text(data.department,'department'),sku:text(data.sku,'SKU'),styleGroup,style}
          const {error}=await db.rpc('save_catalogue_product',{payload});check(error)
        } else {
          const category=text(data.category,'category'),categorySlug=category.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
          const date=text(data.date,'date',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw Error('Enter a valid date.')
          if(!categorySlug)throw Error('Enter a valid category.')
          const payload={id,slug,status,title:text(data.title,'title'),category,categorySlug,excerpt:text(data.excerpt,'excerpt',1000),content:text(data.content,'article',100000),image:image(data.image),author:text(data.author,'author'),date:date+'T00:00:00Z'}
          const {error}=await db.rpc('save_journal_post',{payload});check(error)
        }
      } else throw Error('Unknown action.')
    }
    return Response.json(await readStore(true))
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Unable to save.'},{status:400})}
}
