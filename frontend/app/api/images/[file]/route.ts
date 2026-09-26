import { promises as fs } from 'node:fs'
import path from 'node:path'
export async function GET(_request:Request,{params}:{params:Promise<{file:string}>}){
 const {file}=await params
 if(!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(file))return new Response('Not found',{status:404})
 try{const bytes=await fs.readFile(path.join(process.cwd(),'.store-data/images',file));return new Response(bytes,{headers:{'Content-Type':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}})}catch{return new Response('Not found',{status:404})}
}
