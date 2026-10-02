const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const base=process.env.TEST_BASE_URL||'http://localhost:3012'
test('contact submission persists privately and admin can track it',async()=>{
 const body={id:'a5a5a5a5-1111-4111-8111-111111111111',name:'Adire Teems form test',email:'adireteemsmarketing@gmail.com',subject:'TEST — Contact form and admin inbox',message:'This is a test submission requested for Adire Teems. It checks that the contact form saves an enquiry for admin tracking and attempts its email notification. No customer order is involved.'}
 const post=data=>fetch(base+'/api/contact',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(data)})
 assert.equal((await fetch(base+'/api/admin/contact')).status,401)
 assert.equal((await post({...body,email:'invalid'})).status,400)
 assert.equal((await post({...body,website:'spam.example'})).status,400)
 const result=await post(body);assert.equal(result.status,201);assert.equal((await result.json()).id,body.id)
 assert.equal((await post(body)).status,201)
 const publicData=await(await fetch(base+'/api/store')).json();assert(!('contacts'in publicData));assert(!JSON.stringify(publicData).includes(body.email))
 const password=fs.readFileSync(path.join(__dirname,'../.store-data/admin-access.txt'),'utf8').trim()
 const login=await fetch(base+'/api/admin/session',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password})});assert.equal(login.status,200)
 const cookie=login.headers.get('set-cookie').split(';')[0]
 const get=async()=>{const r=await fetch(base+'/api/admin/contact',{headers:{Cookie:cookie}});assert.equal(r.status,200);return r.json()}
 let inbox=await get();assert.equal(inbox.contacts.filter(c=>c.id===body.id).length,1)
 const contact=inbox.contacts.find(c=>c.id===body.id);assert.equal(contact.message,body.message);assert.equal(contact.notification.recipient,'adireteemsmarketing@gmail.com')
 if(!inbox.emailConfigured)assert.equal(contact.notification.status,'not_configured')
 const update=await fetch(base+'/api/admin/contact',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({id:body.id,status:'in_progress',notes:'Test verified: enquiry saved, visible to admin, and ready for follow-up. Email configuration may still be required.'})});assert.equal(update.status,200)
 inbox=await get();assert.equal(inbox.contacts.find(c=>c.id===body.id).status,'in_progress')
 const disk=JSON.parse(fs.readFileSync(path.join(__dirname,'../.store-data/store.json'),'utf8'));assert(disk.contacts.some(c=>c.id===body.id))
 console.log('Test enquiry retained in admin Messages. Email status: '+contact.notification.status)
 await fetch(base+'/api/admin/session',{method:'DELETE',headers:{Origin:base,Cookie:cookie}})
})
