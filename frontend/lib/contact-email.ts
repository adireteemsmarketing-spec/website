import type { ContactMessage } from './contact-types'
import { getContactForNotification, saveNotification } from './store-db'
import { brand } from './brand'
export const notificationRecipient=()=>process.env.CONTACT_NOTIFICATION_EMAIL||brand.email
export const emailConfigured=()=>Boolean(process.env.RESEND_API_KEY?.startsWith('re_')&&!/your|placeholder/i.test(process.env.RESEND_API_KEY)&&process.env.RESEND_FROM_EMAIL)
const sending=new Map<string,Promise<void>>()
export async function notifyContact(id:string):Promise<void>{
 const pending=sending.get(id);if(pending)return pending
 const operation=send(id).finally(()=>sending.delete(id));sending.set(id,operation);return operation
}
async function send(id:string){
 const contact=await getContactForNotification(id)
 if(!contact||contact.notification.status==='accepted')return
 let notification:ContactMessage['notification']={...contact.notification,attemptedAt:new Date().toISOString()}
 if(!emailConfigured())notification={...notification,status:'not_configured',error:'Set RESEND_API_KEY and RESEND_FROM_EMAIL on the server.'}
 else try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`adire-contact-${contact.id}`},signal:AbortSignal.timeout(10000),body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[contact.notification.recipient],reply_to:contact.email,subject:`Adire Teems enquiry: ${contact.subject}`,text:`New website enquiry\n\nReference: ${contact.id}\nReceived: ${contact.createdAt}\nName: ${contact.name}\nEmail: ${contact.email}\nSubject: ${contact.subject}\n\n${contact.message}\n\nTrack in Adire Admin > Messages.`})})
  const result=await response.json()
  notification=response.ok&&typeof result.id==='string'?{...notification,status:'accepted',providerId:result.id,error:undefined}:{...notification,status:'failed',error:`Email provider rejected the request (HTTP ${response.status}). Check sender verification and credentials.`}
 }catch{notification={...notification,status:'failed',error:'Email service could not be reached. Your enquiry is saved; retry from admin.'}}
 await saveNotification(id,notification)
}
