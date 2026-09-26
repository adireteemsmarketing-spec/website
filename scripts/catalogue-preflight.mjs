import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createClient } = require('../frontend/node_modules/@supabase/supabase-js')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
for (const [table, fields] of [['categories', 'id,name,slug'], ['locations', 'id,name,active'], ['products', 'id,name,slug,status']]) {
  const { data, error } = await db.from(table).select(fields)
  if (error) throw Error(`${table}: ${error.message}`)
  console.log(table, JSON.stringify(data))
}
const { data, error } = await db.storage.listBuckets()
if (error) throw Error(error.message)
console.log('Storage', JSON.stringify(data.map(b => ({ name: b.name, public: b.public, allowed_mime_types: b.allowed_mime_types, file_size_limit: b.file_size_limit }))))
