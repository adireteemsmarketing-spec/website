'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronDown, Search } from 'lucide-react'

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const faqs = [
  {
    "category": "Products & Materials",
    "questions": [
      {
        "q": "What does Adire Teems offer?",
        "a": "Adire Teems offers African fashion and textiles. Browse the shop for the fabrics, clothing and designs currently listed."
      },
      {
        "q": "How do I choose a size or fabric length?",
        "a": "Check the options and details on the product page. If you need help with sizing, fit or fabric length, contact our team before ordering."
      },
      {
        "q": "Where can I find fabric and design details?",
        "a": "Each product page includes its description, photographs and available options. Materials and designs vary by product; ask us if a detail needs clarification."
      }
    ]
  },
  {
    "category": "Ordering & Payment",
    "questions": [
      {
        "q": "How do I place an order?",
        "a": "Choose a product and available option, add it to your bag, then continue to checkout. Sign in or create a customer account to enter your delivery details and pay."
      },
      {
        "q": "What payment methods do you accept?",
        "a": "Online checkout uses Paystack. The payment methods available for your transaction are shown on the Paystack payment page."
      },
      {
        "q": "Does Adire Teems collect my card details?",
        "a": "You enter payment details on Paystack, not on our website. Your order records the payment reference and confirmation after verification."
      },
      {
        "q": "What if my payment was interrupted?",
        "a": "Open your order and check its payment status before paying again. If you need help, contact our team with your order number and payment reference. Do not share your password or full card details."
      }
    ]
  },
  {
    "category": "Delivery & Tracking",
    "questions": [
      {
        "q": "Are delivery charges included at checkout?",
        "a": "Payment at checkout covers your items. Delivery charges are arranged separately with our team. Confirm the cost and arrangements for your destination with us."
      },
      {
        "q": "How long will delivery take?",
        "a": "Contact our team to confirm expected timing for your order and destination. Preparation and delivery updates appear in your account as the team adds them."
      },
      {
        "q": "How do I track my order?",
        "a": "Open Order Tracking from the footer, sign in with the account used at checkout and select your order. Carrier details and tracking links appear when provided by the team."
      },
      {
        "q": "Can I arrange delivery outside Nigeria?",
        "a": "Contact our team with your destination before ordering to confirm available delivery arrangements and costs."
      }
    ]
  },
  {
    "category": "Returns & Product Concerns",
    "questions": [
      {
        "q": "How do I ask about a return or exchange?",
        "a": "Contact our team with your order number and the reason for your request before sending anything back. The team will review your purchase and explain the available next steps and any costs or refund arrangements that apply."
      },
      {
        "q": "What if I receive an incorrect or damaged item?",
        "a": "Contact our team with your order number, a description of the issue and relevant photos so we can review it and discuss the next steps."
      },
      {
        "q": "Can I change or cancel an order?",
        "a": "Contact us as soon as possible with your order number. The team will check the current order status and explain what changes may be possible."
      }
    ]
  },
  {
    "category": "Account & Care",
    "questions": [
      {
        "q": "How do I create an account?",
        "a": "Open your customer dashboard or continue to checkout, then choose Create an account. Follow the sign-up instructions and confirm your email if prompted."
      },
      {
        "q": "How do I reset my password?",
        "a": "Choose Forgot password on the sign-in form, enter your email address and follow the recovery link sent to that address."
      },
      {
        "q": "How should I care for my purchase?",
        "a": "Follow the care label supplied with your item. Because fabrics and finishes vary, contact our team if you need guidance for a particular piece."
      },
      {
        "q": "Where can I read your shopping and privacy policies?",
        "a": "Choose Policies in the footer for information about orders, payments, delivery, product concerns and how the website uses customer information."
      }
    ]
  },
  {
    "category": "About Adire Teems",
    "questions": [
      {
        "q": "Where can I visit Adire Teems?",
        "a": "Visit Adire Teems Lounge, Blenco Shopping Mall, Ilasan, Lekki, Lagos. Contact our team to arrange your visit."
      },
      {
        "q": "How can I ask about events or collaborations?",
        "a": "Open Events in the footer, or contact our team about confirmed event details, exhibitions, pop-ups or collaboration enquiries."
      }
    ]
  }
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
                No questions found matching &quot;{searchTerm}&quot;
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
            Can&apos;t find the answer you&apos;re looking for? Our support team is ready to help.
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
