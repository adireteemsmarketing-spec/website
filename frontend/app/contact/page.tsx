"use client"

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MessageSquare, Send } from "lucide-react"
import { brand } from '@/lib/brand'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const submissionId = useRef('')
  const inFlight = useRef(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement
    setSubmitted(false)
    setError('')
    submissionId.current = ''
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(inFlight.current)return
    inFlight.current=true
    if(!submissionId.current)submissionId.current=crypto.randomUUID()
    const website = new FormData(e.currentTarget).get('website')
    setBusy(true); setError(''); setSubmitted(false)
    try {
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...formData,id:submissionId.current,website})})
      const result=await response.json()
      if(!response.ok)throw Error(result.error || 'Unable to submit. Please try again.')
      setReference(result.id); setSubmitted(true)
      setFormData({name:'',email:'',subject:'',message:''})
      submissionId.current=''
    }catch(error){setError(error instanceof Error?error.message:'Unable to submit. Please try again.')}
    finally{inFlight.current=false;setBusy(false)}
  }

  return (
    <div className="relative min-h-screen bg-black">

      <main className="-mt-12 px-6 pb-20 md:px-12 lg:px-16 text-black">
        {/* Centered hero text */}
        <div className="mx-auto max-w-[1152px] text-center py-12">
          <h1 className="text-5xl leading-tight font-heading text-white">Contact Us — Get in Touch</h1>
          <p className="mt-6 text-lg text-gray-200">Have questions, partnerships or media requests? Call or email our team, or visit Adire Teems Lounge in Lekki, Lagos.</p>
        </div>

        <div className="mx-auto max-h-[1800px] max-w-[1152px] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left column: contact blocks (Customer Support first) */}
          <div className="space-y-6">
            <div className="bg-transparent p-6 rounded-lg">
              <div className="flex gap-4 items-start">
                <MessageSquare className="w-6 h-6 text-[#e4c158] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Customer Support</h3>
                  <p className="text-sm text-gray-300">Have questions about products, orders, or shipping? Our support team is ready to help.</p>
                </div>
              </div>
            </div>

            <div className="bg-transparent p-6 rounded-lg">
              <div className="flex gap-4 items-start">
                <Mail className="w-6 h-6 text-[#e4c158] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Partnerships</h3>
                  <p className="text-sm text-gray-300">Interested in collaboration, wholesale, or sponsorship? Email <a className="break-words text-[#e4c158] underline" href={`mailto:${brand.email}`}>{brand.email}</a>.</p>
                </div>
              </div>
            </div>

            <div className="bg-transparent p-6 rounded-lg">
              <div className="flex gap-4 items-start">
                <Phone className="w-6 h-6 text-[#e4c158] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Phone</h3>
                  <div className="space-y-2 text-sm text-gray-300">{brand.phones.map(phone => <a key={phone.href} href={phone.href} className="block hover:text-[#e4c158]">{phone.label}</a>)}</div>
                </div>
              </div>
            </div>

            <div className="bg-transparent p-6 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Address</h4>
              <address className="text-sm not-italic text-gray-300">{brand.address}</address>
            </div>
          </div>

          {/* Right column: contact form */}
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-xl mx-auto md:mx-0 self-start">
            <h2 className="text-2xl font-semibold mb-4 font-heading">Send a Message</h2>

            {submitted && <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">Your message has been received. Our team will follow up.<span className="mt-2 block break-all text-xs">Reference: {reference}</span></div>}
            {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <fieldset disabled={busy} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} required placeholder="Full name" className="w-full px-4 py-3 border rounded" />
                <input name="email" value={formData.email} onChange={handleChange} required type="email" placeholder="Email address" className="w-full px-4 py-3 border rounded" />
              </div>

              <input name="subject" value={formData.subject} onChange={handleChange} required placeholder="Subject" className="w-full px-4 py-3 border rounded" />

              <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} placeholder="Tell us what's on your mind..." className="w-full px-4 py-3 border rounded resize-none" />

              <div className="flex">
                <Button type="submit" className="flex items-center gap-2 bg-black text-[#e4c158] px-5 py-3 border border-[#e4c158] hover:opacity-95">
                  <Send className="w-4 h-4" />
                  {busy ? 'Sending…' : 'Send Message'}
                </Button>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
        <section className="mt-12 max-w-3xl mx-auto text-white">
            <h2 className="text-2xl font-semibold text-center mb-6">Quick Answers</h2>
            <div className="space-y-4">
              {[
                { q: 'What is Adire fabric?', a: 'Adire is a traditional West African textile created using a resist-dyeing technique with indigo dye. Each piece is handcrafted by master artisans.' },
                { q: 'How long does shipping take?', a: 'Domestic orders typically arrive within 5-7 business days. International orders may take 2-4 weeks depending on location.' },
                { q: 'Do you offer returns?', a: 'Yes! We offer a 30-day return policy on all items in original condition with tags attached.' },
                ].map((item, idx) => (
                <details key={idx} className="border rounded p-4">
                  <summary className="font-medium">{item.q}</summary>
                  <p className="mt-3 text-sm text-[#e4c158]">{item.a}</p>
                </details>
                  ))}
              </div>
            </section>
      </main>
    </div>
  )
}
