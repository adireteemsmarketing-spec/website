'use client'
import type { Store } from '@/lib/store-db'
export function InventoryEditor({store,busy,save}:{store:Store;busy:boolean;save:(kind:string,action:string,data:Record<string,string|number>)=>Promise<void>}) {
  return <section className="space-y-5"><p>Stock is tracked separately for each size, colour, and location. Enter a positive adjustment to add stock or a negative adjustment to remove it.</p>
    {!store.locations.length&&<p>Create an active location in Supabase before adding stock.</p>}
    {store.variants.map(v=><article key={v.id} className="border bg-white p-5"><h2 className="font-semibold">{v.name} — {v.size} / {v.color}</h2><p className="text-sm">SKU: {v.sku}</p>
      {store.locations.map(l=>{const stock=v.stock.find(s=>s.locationId===l.id);return <p key={l.id}>{l.name}: {(stock?.quantity||0)-(stock?.reserved||0)} available ({stock?.reserved||0} reserved)</p>})}
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);void save('products','stock',{variantId:v.id,locationId:String(form.get('location')),delta:Number(form.get('delta')),reason:String(form.get('reason'))})}}>
        <label>Location<select name="location" required>{store.locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <label>Adjustment<input name="delta" type="number" step="1" required placeholder="e.g. 10 or -2"/></label>
        <label>Reason<input name="reason" required minLength={3} maxLength={500} placeholder="Opening stock count"/></label>
        <button disabled={busy||!store.locations.length} className="store-primary">Apply adjustment</button>
      </form></article>)}
    {!store.variants.length&&<p>Create a product with its sizes first.</p>}
  </section>
}
