'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { Product } from '@/lib/catalog'
import type { Post } from '@/lib/store-db'
import type { Promotion } from '@/lib/promotion'
const Context=createContext<{products:Product[];posts:Post[];promotion:Promotion|null;loaded:boolean}>({products:[],posts:[],promotion:null,loaded:false})
export function StoreProvider({children}:{children:React.ReactNode}){
 const [state,setState]=useState({products:[] as Product[],posts:[] as Post[],promotion:null as Promotion|null,loaded:false})
 useEffect(()=>{let active=true,inFlight=false;async function refresh(){if(inFlight)return;inFlight=true;try{const r=await fetch('/api/store',{cache:'no-store'});if(!r.ok)return;const data=await r.json();if(active)setState({...data,loaded:true})}catch{}finally{inFlight=false}}refresh();window.addEventListener('focus',refresh);window.addEventListener('adire-store-changed',refresh);const timer=setInterval(refresh,15000);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('adire-store-changed',refresh)}},[])
 return <Context.Provider value={state}>{children}</Context.Provider>
}
export const useStore=()=>useContext(Context)
