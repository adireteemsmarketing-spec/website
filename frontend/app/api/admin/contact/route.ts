import { isAdmin, sameOrigin } from '@/lib/admin-auth'
import { readContacts, updateContact } from '@/lib/store-db'
import { emailConfigured, notificationRecipient, notifyContact } from '@/lib/contact-email'
export const dynamic='force-dynamic'
async function inbox(){return Response.json({contacts:(await readContacts()),emailConfigured:emailConfigured(),recipient:notificationRecipient()},{headers:{'Cache-Control':'no-store'}})}
export async function GET(){if(!await isAdmin())return Response.json({error:'Sign in to view messages.'},{status:401});return inbox()}
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Sign in to continue.'},{status:403})
 try{
  const body=await request.json()
  if(typeof body.id!=='string')throw Error('Invalid message.')
  if(body.action==='retry'){
   if(!(await readContacts()).some(c=>c.id===body.id))throw Error('Message not found.')
   await notifyContact(body.id)
  }else{
   if(!['new','in_progress','resolved'].includes(body.status)||typeof body.notes!=='string'||body.notes.length>5000)throw Error('Invalid status or notes.')
   await updateContact(body.id,body.status,body.notes)
  }
  return inbox()
 }catch(error){return Response.json({error:(error as Error).message},{status:400})}
}
