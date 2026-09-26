import 'server-only'
import type { Product } from './catalog'
import type { ContactMessage } from './contact-types'
import { brand } from './brand'
import { createPublicClient } from './supabase/public'
import { createAdminClient } from './supabase/admin'
import { adminSession } from './admin-auth'
import { mediaUrl } from './storage'
export type Post = { id: string; slug: string; title: string; category: string; excerpt: string; content: string; image: string; author: string; date: string; status: 'published' | 'draft' }
export type InventoryVariant = { id: string; productId: string; name: string; size: string; color: string; sku: string; stock: { locationId: string; quantity: number; reserved: number }[] }
export type Store = { products: Product[]; posts: Post[]; contacts: ContactMessage[]; settings: { name: string; email: string; lowStock: number }; variants: InventoryVariant[]; locations: {id:string;name:string}[]; categories: {slug:string;name:string}[]; role?: string }
export function check(error: { message: string } | null) { if (error) throw new Error(error.message) }
const defaults = { name: brand.name, email: brand.email, lowStock: 5 }
// Page every query: PostgREST's default row cap must not silently truncate a store.
async function all<T>(query: { range: (from:number,to:number) => PromiseLike<{data:T[] | null;error:{message:string}|null}> }): Promise<T[]> {
  const result:T[]=[]
  for(let offset=0;;offset+=500) { const {data,error}=await query.range(offset,offset+499);check(error);result.push(...(data||[]));if(!data||data.length<500)return result }
}
export async function readStore(admin = false): Promise<Store> {
  const session = admin ? await adminSession() : null
  if (admin && !session) throw new Error('Admin access required.')
  const db = session?.db || createPublicClient()
  const [products, variants, images, categories, posts, blogCategories] = await Promise.all([
    all(db.from('products').select('*').neq('status','archived').order('id')),
    all(db.from('product_variants').select('*').eq('active',true).order('id')),
    all(db.from('product_images').select('*').order('sort_order').order('id')),
    all(db.from('categories').select('id,slug,name').order('id')),
    all(db.from('blog_posts').select('*').neq('status','archived').order('id')),
    all(db.from('blog_categories').select('id,name').order('id'))
  ])
  const inventory = session ? await all(db.from('inventory').select('*').order('id')) : []
  const locations = session ? await all(db.from('locations').select('id,name').eq('active',true).order('id')) : []
  const availability = new Map<string,boolean>()
  if (!admin && variants.length) {
    // Only inspect variants already visible through public catalogue RLS.
    // Exact inventory stays in this server-only module; the response exposes
    // availability booleans, never counts or location details.
    const stockDb = createAdminClient()
    const visibleProductIds = new Set(products.map(p => p.id))
    const variantIds = variants.filter(v => visibleProductIds.has(v.product_id)).map(v => v.id)
    const batches: string[][] = []
    for (let offset = 0; offset < variantIds.length; offset += 100) batches.push(variantIds.slice(offset, offset + 100))
    await Promise.all(batches.map(async ids => {
      const stock = await all(stockDb.from('inventory').select('id,variant_id,quantity,reserved,locations!inner(active)').in('variant_id', ids).eq('locations.active', true).order('id'))
      for (const row of stock) if (Number(row.quantity) > Number(row.reserved)) availability.set(row.variant_id, true)
    }))
  }
  const settings = {...defaults}
  if(session?.role==='super_admin') {
    const {data,error}=await db.from('store_settings').select('value').eq('key','storefront').maybeSingle();check(error)
    if(data) Object.assign(settings,data.value)
  }
  const inventoryVariants:InventoryVariant[] = admin ? variants.filter(v=>products.some(p=>p.id===v.product_id)).map(v=>({
    id:v.id, productId:v.product_id, name:products.find(p=>p.id===v.product_id)!.name, size:v.size,color:v.color,sku:v.sku,
    stock:inventory.filter(i=>i.variant_id===v.id).map(i=>({locationId:i.location_id,quantity:i.quantity,reserved:i.reserved}))
  })) : []
  return {
    products: products.map(p=>{
      const sizes=variants.filter(v=>v.product_id===p.id)
      return {id:p.id,name:p.name,slug:p.slug,price:Number(p.base_price),currency:p.currency,
        image:mediaUrl(images.find(i=>i.product_id===p.id)?.storage_path || ''),
        images:images.filter(i=>i.product_id===p.id).map(i=>({url:mediaUrl(i.storage_path),alt:i.alt_text||p.name})),
        category:categories.find(c=>c.id===p.category_id)?.slug||'',
        description:p.description_long||p.description_short,fabric:p.fabric||'',department:p.department,styleGroup:p.style_group,style:p.style,
        sku:p.sku||sizes[0]?.sku||'',sizes:[...new Set(sizes.map(v=>v.size as string))],status:p.status==='active'?'published':'draft',
        ...(admin?{stock:inventory.filter(i=>sizes.some(v=>v.id===i.variant_id)&&locations.some(l=>l.id===i.location_id)).reduce((n,i)=>n+i.quantity-i.reserved,0)}:
        {inStock:sizes.some(v=>availability.get(v.id)),availableSizes:sizes.filter(v=>availability.get(v.id)).map(v=>v.size as string)})}
    }),
    posts:posts.map(p=>({id:p.id,slug:p.slug,title:p.title,category:blogCategories.find(c=>c.id===p.category_id)?.name||'',excerpt:p.excerpt,content:p.content,image:mediaUrl(p.featured_image||''),author:p.author_name,date:(p.published_at||p.created_at).slice(0,10),status:p.status==='published'?'published':'draft'})),
    contacts:[],settings,variants:inventoryVariants,locations,categories:categories.map(c=>({slug:c.slug,name:c.name})),role:session?.role
  }
}
function mapContact(row: Record<string,unknown>): ContactMessage {
  return {id:String(row.id),name:String(row.name),email:String(row.email),subject:String(row.subject),message:String(row.message),
    createdAt:String(row.created_at),updatedAt:String(row.updated_at),status:row.status==='open'?'in_progress':row.status==='closed'?'resolved':'new',notes:String(row.notes||''),
    notification:row.notification as ContactMessage['notification']}
}
export async function readContacts() {
  const session=await adminSession();if(!session)throw new Error('Admin access required.')
  return (await all(session.db.from('contact_messages').select('*').order('created_at',{ascending:false}).order('id'))).map(mapContact)
}
export async function getContactForNotification(id:string) {
  const {data,error}=await createAdminClient().from('contact_messages').select('*').eq('id',id).maybeSingle();check(error)
  return data?mapContact(data):null
}
export async function saveNotification(id:string,notification:ContactMessage['notification']) {
  const {error}=await createAdminClient().from('contact_messages').update({notification}).eq('id',id);check(error)
}
export async function submitContact(data:{id:string;name:string;email:string;subject:string;message:string},recipient:string) {
  const {error}=await createAdminClient().rpc('submit_contact',{payload:{...data,recipient}});check(error)
}
export async function updateContact(id:string,status:ContactMessage['status'],notes:string) {
  const session=await adminSession();if(!session)throw new Error('Admin access required.')
  const {data,error}=await session.db.from('contact_messages').update({status:status==='in_progress'?'open':status==='resolved'?'closed':'new',notes}).eq('id',id).select('id').single();check(error)
  if(!data)throw new Error('Message not found.')
}

