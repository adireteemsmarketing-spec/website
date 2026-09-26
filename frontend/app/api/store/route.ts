import { readStore } from '@/lib/store-db'
export const dynamic='force-dynamic'
export async function GET() { try {const store=await readStore(); return Response.json({products:store.products.filter(p=>p.status==='published'),posts:store.posts.filter(p=>p.status==='published')},{headers:{'Cache-Control':'no-store'}})} catch {return Response.json({error:'Store data is unavailable.'},{status:503})} }
