'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search } from 'lucide-react'
import { brand } from '@/lib/brand'

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const faqs = [
    {
      category: 'Products & Materials',
      questions: [
        {
          q: 'What is Adire fabric?',
          a: 'Adire is a traditional West African textile, particularly from Nigeria, created using a resist-dyeing technique with indigo dye. The patterns are created by folding, binding, stitching, or stenciling the fabric before dyeing, resulting in unique, intricate patterns. Each piece is handcrafted by master artisans.',
        },
        {
          q: 'Are your products 100% authentic Adire?',
          a: 'Yes. All our products are 100% authentic Adire textiles crafted using traditional methods by master artisans. We partner directly with established craftspeople in Nigeria to ensure authenticity and quality.',
        },
        {
          q: 'What sizes do you offer for fabric?',
          a: 'We offer fabrics in various lengths: 2 yards, 3 yards, 5 yards, and custom lengths upon request. Our menswear collection comes in standard sizes XS to XXL.',
        },
        {
          q: 'Can I order custom sizes or patterns?',
          a: `Yes! We offer custom orders for bulk purchases. Please contact our team at ${brand.email} to discuss your specific requirements.`,
        },
      ],
    },
    {
      category: 'Ordering & Payment',
      questions: [
        {
          q: 'How do I place an order?',
          a: 'Simply browse our shop, select your desired items, add them to your cart, and proceed to checkout. You can create an account or check out as a guest.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, Mastercard, American Express), bank transfers, and digital payment platforms like PayPal and Stripe.',
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, absolutely. We use industry-standard SSL encryption to protect all payment data. We never store full credit card information on our servers.',
        },
        {
          q: 'Do you offer payment plans?',
          a: 'For orders over a certain amount, we offer installment payment options through our financing partners. Contact us for details.',
        },
      ],
    },
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Domestic orders (Nigeria) typically arrive within 5-7 business days. International orders may take 2-4 weeks depending on your location and customs processing.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes! We ship to most countries worldwide. Shipping costs and times vary by location. Check our shipping calculator at checkout for precise details.',
        },
        {
          q: 'Can I track my order?',
          a: 'Yes. You will receive a tracking number via email as soon as your order ships. You can track your package in real-time through our tracking portal.',
        },
        {
          q: 'What if my order is damaged during shipping?',
          a: 'We package all items carefully to prevent damage. If your order arrives damaged, contact us within 48 hours with photos, and we will arrange a replacement or refund.',
        },
      ],
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 30-day return policy. Items must be in original condition with all tags attached. Once received and inspected, refunds are processed within 5-7 business days.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Log into your account, go to your orders, and click "Return Item." Follow the instructions and print the prepaid shipping label. Send the item back to us.',
        },
        {
          q: 'Do you charge for returns?',
          a: 'We provide prepaid return shipping labels for all eligible returns. Non-eligible returns may be subject to return shipping costs.',
        },
        {
          q: 'Can I exchange an item instead of returning it?',
          a: 'Yes! Exchanges are free if the replacement item is the same price. If exchanging for a higher-priced item, you will need to pay the difference.',
        },
      ],
    },
    {
      category: 'Care & Maintenance',
      questions: [
        {
          q: 'How do I care for my Adire fabric?',
          a: 'Hand wash in cool water with mild soap. Avoid bleach and fabric softeners. Dry in the shade to prevent fading. Iron on low heat if needed. Adire naturally becomes softer with age.',
        },
        {
          q: 'Will the indigo color fade?',
          a: 'Natural indigo may have some fading over time and with use, which is part of the charm and authenticity of the fabric. This adds character and uniqueness to your piece.',
        },
        {
          q: 'Can I machine wash Adire?',
          a: 'We recommend hand washing to preserve the quality and longevity of your Adire fabric. Machine washing may accelerate fading.',
        },
        {
          q: 'How do I store my Adire fabric?',
          a: 'Store in a cool, dry place away from direct sunlight. Avoid plastic storage—use breathable cotton bags. Keep away from moisture to prevent mold.',
        },
      ],
    },
    {
      category: 'Account & Orders',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" on our homepage and fill in your email and password. You can also sign up during checkout. An account lets you track orders and save favorites.',
        },
        {
          q: 'Can I view my order history?',
          a: 'Yes. Log into your account and go to "Orders" to view all your past purchases and their status.',
        },
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page. Enter your email, and we will send you a password reset link.',
        },
        {
          q: 'Can I change my order after placing it?',
          a: `If your order has not shipped yet, contact us immediately at ${brand.email} and we will do our best to modify it.`,
        },
      ],
    },
    {
      category: 'Sustainability & Ethics',
      questions: [
        {
          q: 'How do you ensure fair trade practices?',
          a: 'We partner directly with artisans and pay them above-market rates. We maintain long-term relationships to ensure their economic stability and well-being.',
        },
        {
          q: 'What makes your production sustainable?',
          a: 'We use natural indigo dyes from sustainable sources, minimize water waste, and employ eco-friendly production methods. Our packaging is recyclable and biodegradable.',
        },
        {
          q: 'Do you support the local community?',
          a: 'Yes. We invest in community development programs, support artisan training initiatives, and contribute to educational programs in the regions where we work.',
        },
        {
          q: 'Can I learn more about your sustainability practices?',
          a: `Visit our About page or contact us at ${brand.email}. We are committed to transparency and love sharing our impact story.`,
        },
      ],
    },
  ]

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(item => `${item.q} ${item.a}`.toLowerCase().includes(searchTerm.toLowerCase().trim())),
  })).filter(category => category.questions.length > 0)
  const handleToggle = (index: number) => setExpandedIndex(current => current === index ? null : index)

  return (
    <div className="min-h-screen bg-[#1C1B1B]">
      {/* Hero Section */}
      <section className="bg-black text-white px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className=" text-4xl md:text-5xl font-bold font-heading mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text--200">
            Find answers to common questions about our products, orders, and services.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="px-4 py-12 md:px-8 bg-black-900">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setExpandedIndex(null) }}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold font-heading text-primary mb-8 pb-4 border-b-2 border-accent">
                {category.category}
              </h2>

              <div className="space-y-4">
                {category.questions.map((item, questionIndex) => {
                  const globalIndex = categoryIndex * 100 + questionIndex
                  return (
                    <button
                      key={globalIndex}
                      onClick={() => handleToggle(globalIndex)}
                      className="w-full text-left border border-gray-300 rounded-lg p-6 hover:border-accent hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-semibold text-primary flex-1">
                          {item.q}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 text-accent flex-shrink-0 transition-transform ${
                            expandedIndex === globalIndex ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {expandedIndex === globalIndex && (
                        <p className="text-yellow-600 mt-4 leading-relaxed">
                          {item.a}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                No questions found matching "{searchTerm}"
              </p>
              <Button
                onClick={() => setSearchTerm('')}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="bg-black-900 px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-heading text-primary mb-6">
            Still Have Questions?
          </h2>
          <p className="text-yellow-600 mb-8">
            Can't find the answer you're looking for? Our support team is ready to help.
          </p>
          <Link href="/contact">
            <Button className="bg-primary text-black hover:bg-primary/90 px-8 py-6 text-base font-semibold">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
