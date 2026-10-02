import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin-auth'
export const dynamic='force-dynamic'
export async function GET(request:Request) {
  const reference=new URL(request.url).searchParams.get('path')||''
  if(!/^(draft-media|product-images|journal-images)\/[a-zA-Z0-9/_.-]+$/.test(reference)||reference.includes('..'))return new Response('Not found',{status:404})
  try {
    const db=createPublicClient()
    // RLS hides draft products and future/draft articles even from an admin's
    // browser here; a separate verified session permits private previews.
    const [product,post,promotion]=await Promise.all([
      db.from('product_images').select('id').eq('storage_path',reference).limit(1),
      db.from('blog_posts').select('id').eq('featured_image',reference).limit(1),
      db.from('site_content').select('key').eq('key','homepage_promotion').eq('published',true).eq('value->>image',reference).limit(1)
    ])
    if(product.error||post.error)throw Error('Media lookup failed')
    const published=Boolean(product.data?.length||post.data?.length||promotion.data?.length)
    if(!published&&!await isAdmin())return new Response('Not found',{status:404})
    const slash=reference.indexOf('/')
    const {data,error}=await createAdminClient().storage.from(reference.slice(0,slash)).download(reference.slice(slash+1))
    if(error||!data)return new Response('Not found',{status:404})
    return new Response(data,{headers:{'Content-Type':data.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
  } catch {return new Response('Media unavailable',{status:503})}
}
