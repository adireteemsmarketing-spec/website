const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const base=process.env.TEST_BASE_URL||'http://localhost:3012'
test('admin publishing, inventory and public journal share persistent records',async()=>{
 let response=await fetch(base+'/api/admin/store');assert.equal(response.status,401)
 const password=fs.readFileSync(path.join(__dirname,'../.store-data/admin-access.txt'),'utf8').trim()
 response=await fetch(base+'/api/admin/session',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({password})})
 assert.equal(response.status,200)
 const cookie=response.headers.get('set-cookie').split(';')[0]
 const imageForm=new FormData()
 const imageBytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')
 imageForm.set('image',new Blob([imageBytes],{type:'image/png'}),'test.png')
 response=await fetch(base+'/api/admin/images',{method:'POST',headers:{Origin:base,Cookie:cookie},body:imageForm});assert.equal(response.status,200)
 const imageUrl=(await response.json()).url
 assert.match(imageUrl,/^\/api\/images\/[a-f0-9-]{36}\.png$/)
 try{response=await fetch(base+imageUrl);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.equal((await response.arrayBuffer()).byteLength,imageBytes.length)}finally{fs.unlinkSync(path.join(__dirname,'../.store-data/images',imageUrl.split('/').pop()))}
 const send=async(kind,action,data)=>fetch(base+'/api/admin/store',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({kind,action,data})})
 const suffix=Date.now(), slug='test-product-'+suffix, postSlug='test-article-'+suffix
 const product={name:'Integration test product',slug,description:'Test description',price:125,stock:7,sku:'TEST-'+suffix,sizes:'S, M',department:'women',styleGroup:'Dress',style:'Spaghetti',category:'dresses',fabric:'Adire',image:'/images/adire1.jpeg',status:'draft'}
 let productId,postId
 try {
  response=await send('products','save',product);assert.equal(response.status,200);productId=(await response.json()).products.find(p=>p.slug===slug).id
  let publicData=await (await fetch(base+'/api/store')).json();assert(!publicData.products.some(p=>p.slug===slug))
  response=await send('products','save',{...product,id:productId,status:'published'});assert.equal(response.status,200)
  publicData=await (await fetch(base+'/api/store')).json();assert.equal(publicData.products.find(p=>p.slug===slug).stock,7)
  assert.equal(publicData.products.find(p=>p.slug===slug).style,'Spaghetti')
  response=await send('products','save',{...product,id:productId,styleGroup:'Bubu',style:'Spaghetti'});assert.equal(response.status,400)
  response=await fetch(base+'/product/'+slug);assert.equal(response.status,200);assert((await response.text()).includes('Integration test product'))
  response=await send('products','stock',{id:productId,stock:2.5});assert.equal(response.status,400)
  response=await send('products','stock',{id:productId,stock:0});assert.equal(response.status,200)
  publicData=await (await fetch(base+'/api/store')).json();assert.equal(publicData.products.find(p=>p.slug===slug).stock,0)
  const article={slug:postSlug,title:'Integration journal test',category:'Heritage',excerpt:'A test excerpt',content:'Unique complete article body for publishing verification.',image:'/images/adire1.jpeg',author:'Test author',date:'2026-09-14',status:'published'}
  response=await send('posts','save',article);assert.equal(response.status,200);postId=(await response.json()).posts.find(p=>p.slug===postSlug).id
  response=await fetch(base+'/blog/'+postSlug);assert.equal(response.status,200);assert((await response.text()).includes(article.content))
  assert((await (await fetch(base+'/blog')).text()).includes(article.title))
  const disk=JSON.parse(fs.readFileSync(path.join(__dirname,'../.store-data/store.json'),'utf8'));assert(disk.posts.some(p=>p.id===postId))
  response=await fetch(base+'/api/admin/store',{method:'POST',headers:{Origin:'https://foreign.example',Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({kind:'products',action:'stock',data:{id:productId,stock:99}})});assert.equal(response.status,403)
 } finally {
  if(productId)assert.equal((await send('products','delete',{id:productId})).status,200)
  if(postId)assert.equal((await send('posts','delete',{id:postId})).status,200)
 }
 assert.equal((await fetch(base+'/product/'+slug)).status,404)
 await fetch(base+'/api/admin/session',{method:'DELETE',headers:{Origin:base,Cookie:cookie}})
})
