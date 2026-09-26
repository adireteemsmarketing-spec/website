const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const ts=require('typescript')
test('email transport handles missing configuration, rejection and provider acceptance',async()=>{
 const oldFetch=global.fetch,oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.RESEND_FROM_EMAIL
 const contact={id:'unit-test',name:'Test',email:'reply@example.test',subject:'Test subject',message:'Text <not HTML>',createdAt:'2026-09-14',notification:{status:'pending',recipient:'target@example.test'}}
 const store={contacts:[contact]}
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/contact-email.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}}
 new Function('require','module','exports',code)(name=>name==='./store-db'?{readStore:async()=>store,changeStore:async cb=>cb(store)}:{brand:{email:'default@example.test'}},module,module.exports)
 try{
  delete process.env.RESEND_API_KEY;delete process.env.RESEND_FROM_EMAIL
  global.fetch=async()=>{throw Error('Network must not be used without configuration')}
  await module.exports.notifyContact(contact.id);assert.equal(contact.notification.status,'not_configured')
  process.env.RESEND_API_KEY='re_test_only';process.env.RESEND_FROM_EMAIL='Store <sender@example.test>'
  global.fetch=async()=>({ok:false,status:403,json:async()=>({})})
  await module.exports.notifyContact(contact.id);assert.equal(contact.notification.status,'failed');assert.equal(store.contacts.length,1)
  let calls=0
  global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.resend.com/emails');const data=JSON.parse(options.body);assert.deepEqual(data.to,['target@example.test']);assert.equal(data.reply_to,'reply@example.test');assert(data.text.includes(contact.message));assert.equal(options.headers['Idempotency-Key'],'adire-contact-unit-test');return{ok:true,json:async()=>({id:'provider-test-reference'})}}
  await module.exports.notifyContact(contact.id);assert.equal(contact.notification.status,'accepted');assert.equal(contact.notification.providerId,'provider-test-reference')
  await module.exports.notifyContact(contact.id);assert.equal(calls,1)
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;if(oldFrom===undefined)delete process.env.RESEND_FROM_EMAIL;else process.env.RESEND_FROM_EMAIL=oldFrom}
})
