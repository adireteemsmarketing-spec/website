import { isAdmin, sameOrigin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { mediaUrl } from '@/lib/storage'
import { randomUUID } from 'node:crypto'
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Sign in to upload.'},{status:403})
 try{const form=await request.formData();const file=form.get('image');if(!(file instanceof File)||file.size>5*1024*1024)throw Error('Choose a PNG, JPEG or WebP image up to 5 MB.')
 const bytes=Buffer.from(await file.arrayBuffer());let ext=''
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png'
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg'
 else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp'
 if(!ext)throw Error('Unsupported image. Use PNG, JPEG or WebP.')
 const name=randomUUID()+'.'+ext
 const db=await createClient('admin')
 const {error}=await db.storage.from('draft-media').upload(name,bytes,{contentType:ext==='jpg'?'image/jpeg':'image/'+ext,upsert:false})
 if(error)throw Error('Unable to upload the image. Check Storage configuration.')
 return Response.json({url:mediaUrl('draft-media/'+name),path:'draft-media/'+name})
 }catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
