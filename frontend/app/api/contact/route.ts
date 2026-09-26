import { submitContact } from '@/lib/store-db'
import { sameOrigin } from '@/lib/admin-auth'
import { notificationRecipient, notifyContact } from '@/lib/contact-email'
export const runtime='nodejs'
function field(value:unknown,label:string,max:number){if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`Enter a valid ${label}.`);return value.trim()}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Please submit through the contact form.'},{status:403})
 if(!request.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Expected JSON.'},{status:415})
 let data
 try{
  if(Number(request.headers.get('content-length'))>20000)throw Error('Message is too large.')
  const raw=await request.text();if(raw.length>20000)throw Error('Message is too large.')
  const body=JSON.parse(raw)
  if(body.website)throw Error('Unable to accept this submission.')
  const email=field(body.email,'email address',254).toLowerCase()
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.')
  if(typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id))throw Error('Reload the form and try again.')
  data={id:body.id,name:field(body.name,'name',120),email,subject:field(body.subject,'subject',200),message:field(body.message,'message',5000)}
  if(/[\r\n]/.test(data.name+data.subject))throw Error('Name and subject must be on one line.')
 }catch(error){return Response.json({error:error instanceof SyntaxError?'Invalid submission.':(error as Error).message},{status:400})}
 try{
  await submitContact(data,notificationRecipient())
 }catch{return Response.json({error:'Unable to save right now. Please try again later or call us.'},{status:503})}
 // Persist first: an email failure must never lose an enquiry.
 try{await notifyContact(data.id)}catch{/* Admin can retry pending email. */}
 return Response.json({id:data.id,message:'Your message has been received. Our team will follow up.'},{status:201})
}
